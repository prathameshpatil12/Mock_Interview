"""
MockAI — Integrated Backend (Module 01 + 02 + 03 + 04)
=======================================================
Framework  : FastAPI
Module 01  : OpenAI Whisper          → Speech-to-Text
Module 02  : Librosa                 → Audio Feature Extraction
Module 03  : Sentence-Transformers   → Semantic Relevance
             spaCy                   → Grammar, POS, Entities
             NLTK                    → Vocabulary, Filler Words, TTR
Module 04  : DeepFace                → Facial Emotion Recognition
             MediaPipe Face Mesh     → Eye Contact + Head Pose

Execution flow:
  Webcam frames → POST /api/frame  (called every 2.5s during recording)
  Audio upload  → POST /api/analyze (runs M01+M02 parallel, then M03, then aggregates M04)

Endpoints:
  GET  /api/health    → all modules status
  GET  /api/questions → question bank
  POST /api/frame     → single webcam frame → real-time facial analysis
  POST /api/analyze   → audio + question → full 4-module report

Run:
  uvicorn app:app --host 0.0.0.0 --port 5000 --reload

Docs: http://localhost:5000/docs
"""

import os, re, time, tempfile, subprocess, base64, threading
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional, Dict
import asyncio

import numpy as np
import cv2
import torch
import whisper
import librosa

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ═══════════════════════════════════════════════════════════════════════════
# FFmpeg — auto-inject Windows paths
# ═══════════════════════════════════════════════════════════════════════════
def _ensure_ffmpeg():
    candidates = [
        r"C:\ffmpeg\bin", r"C:\Program Files\ffmpeg\bin",
        r"C:\Program Files (x86)\ffmpeg\bin",
        str(Path.home() / "ffmpeg" / "bin"),
    ]
    cur = os.environ.get("PATH", "")
    for c in candidates:
        if Path(c).exists() and c not in cur:
            os.environ["PATH"] = c + os.pathsep + cur
            print(f"✅  FFmpeg injected: {c}"); return
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        print("✅  FFmpeg already in PATH")
    except FileNotFoundError:
        print("⚠️  FFmpeg NOT found")

_ensure_ffmpeg()

def _ffmpeg_ok() -> bool:
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        return True
    except Exception:
        return False

def _to_wav(src: str) -> str:
    dst = src + "_converted.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-i", src, "-ar", "16000", "-ac", "1", "-f", "wav", dst],
        capture_output=True, check=True
    )
    return dst


# ═══════════════════════════════════════════════════════════════════════════
# Global model handles
# ═══════════════════════════════════════════════════════════════════════════
DEVICE        = ""
WHISPER_MODEL = None
ST_MODEL      = None
SPACY_NLP     = None

IDEAL_ANSWERS = {
    "Personal": (
        "I am a dedicated professional with strong communication and problem-solving skills. "
        "I have experience working in teams, leading projects, and delivering results. "
        "I am passionate about continuous learning and growing in my career."
    ),
    "Behavioral": (
        "I identified the challenge, assessed the situation carefully, collaborated with the team "
        "and implemented a structured, methodical solution. The outcome was measurable and successful."
    ),
    "Technical": (
        "I approached the technical problem systematically by breaking it into smaller components, "
        "researching best practices, writing clean maintainable code, and testing thoroughly."
    ),
    "Situational": (
        "I would stay calm, gather all relevant information, communicate clearly with all stakeholders, "
        "propose a structured solution, and follow up to ensure the matter is resolved professionally."
    ),
}

FILLER_WORDS = {
    "um","uh","like","basically","literally","actually",
    "you know","sort of","kind of","i mean","right","okay so","so"
}

# ── Module 04: per-session frame accumulator ──────────────────────────────
# Keyed by session_id (sent from frontend)
_facial_sessions: Dict[str, list] = {}
_session_lock = threading.Lock()


# ═══════════════════════════════════════════════════════════════════════════
# Startup
# ═══════════════════════════════════════════════════════════════════════════
@asynccontextmanager
async def lifespan(app: FastAPI):
    global DEVICE, WHISPER_MODEL, ST_MODEL, SPACY_NLP

    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"⏳  Loading Whisper 'base' on {DEVICE.upper()} …")
    WHISPER_MODEL = whisper.load_model("base", device=DEVICE)
    print(f"✅  Whisper ready  |  device={DEVICE.upper()}")

    print(f"✅  Librosa ready  |  v{librosa.__version__}")

    from sentence_transformers import SentenceTransformer
    print("⏳  Loading Sentence-Transformer …")
    ST_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    print("✅  Sentence-Transformer ready")

    import spacy
    print("⏳  Loading spaCy …")
    SPACY_NLP = spacy.load("en_core_web_sm")
    print("✅  spaCy ready")

    import nltk
    nltk.download("punkt", quiet=True)
    nltk.download("punkt_tab", quiet=True)
    nltk.download("stopwords", quiet=True)
    print("✅  NLTK ready")

    # DeepFace and MediaPipe are imported on first use (no pre-loading needed)
    print("✅  DeepFace + MediaPipe ready (lazy load)")

    yield


# ═══════════════════════════════════════════════════════════════════════════
# Pydantic schemas
# ═══════════════════════════════════════════════════════════════════════════

class HealthResponse(BaseModel):
    status: str; whisper_model: str; device: str; gpu: bool; gpu_name: str
    ffmpeg_ok: bool; librosa_version: str; spacy_model: str; sentence_transformer: str

class Segment(BaseModel):
    id: int; start: float; end: float; text: str

class STTResult(BaseModel):
    transcript: str; language: str; word_count: int; duration_s: float
    segments: List[Segment]; processing_time_s: float; device_used: str

class PitchFeatures(BaseModel):
    mean_hz: float; std_hz: float; range_hz: float; variation_score: float

class EnergyFeatures(BaseModel):
    mean_rms: float; max_rms: float; energy_score: float

class RhythmFeatures(BaseModel):
    estimated_wpm: int; speech_duration_s: float; silence_duration_s: float
    silence_ratio: float; pause_count: int; avg_pause_s: float; max_pause_s: float

class VoiceQuality(BaseModel):
    voice_stability: float; spectral_centroid: float; zero_crossing_rate: float

class DeliveryScores(BaseModel):
    pitch_score: float; energy_score: float; rhythm_score: float
    stability_score: float; delivery_clarity: float; confidence_label: str

class AudioResult(BaseModel):
    duration_s: float; sample_rate: int
    pitch: PitchFeatures; energy: EnergyFeatures
    rhythm: RhythmFeatures; voice_quality: VoiceQuality
    scores: DeliveryScores; processing_time_s: float

class EntityItem(BaseModel):
    text: str; label: str

class NLPResult(BaseModel):
    relevance_score: float; content_quality_score: float
    similarity_to_question: float; similarity_to_ideal: float
    fluency_score: float; grammar_score: float; clarity_score: float
    vocabulary_score: float; word_count: int; sentence_count: int
    avg_sentence_length: float; type_token_ratio: float
    filler_word_count: int; filler_words_found: List[str]
    named_entities: List[EntityItem]; nlp_overall_score: float
    processing_time_s: float

# ── Module 04 schemas ─────────────────────────────────────────────────────
class FrameResult(BaseModel):
    face_detected:        bool
    dominant_emotion:     str
    emotions:             dict
    confidence_score:     float
    stress_level:         float
    eye_contact_score:    float
    behavioral_stability: float
    error:                Optional[str] = None

class FacialResult(BaseModel):
    frame_count:          int
    face_detected_ratio:  float
    confidence_score:     float
    stress_level:         float
    eye_contact_score:    float
    behavioral_stability: float
    dominant_emotion:     str
    emotions:             dict
    processing_time_s:    float

# ── Module 05 schemas ─────────────────────────────────────────────────────
class DimensionScore(BaseModel):
    label:    str
    score:    float
    weight:   float
    grade:    str
    feedback: str

class FeedbackResult(BaseModel):
    overall_score:     float
    grade:             str
    verdict:           str
    dimensions:        List[DimensionScore]
    strengths:         List[str]
    improvements:      List[str]
    tips:              List[str]
    priority_focus:    str
    processing_time_s: float

# ── Combined response ─────────────────────────────────────────────────────
class AnalyzeResponse(BaseModel):
    question:     str
    category:     str
    stt:          STTResult
    audio:        AudioResult
    nlp:          NLPResult
    facial:       FacialResult
    feedback:     FeedbackResult
    total_time_s: float

class QuestionItem(BaseModel):
    id: int; category: str; question: str

class QuestionsResponse(BaseModel):
    questions: List[QuestionItem]


# ═══════════════════════════════════════════════════════════════════════════
# FastAPI app
# ═══════════════════════════════════════════════════════════════════════════
app = FastAPI(
    title       = "MockAI · M01+M02+M03+M04+M05",
    description = "Whisper · Librosa · Sentence-Transformers · spaCy · DeepFace · MediaPipe · Feedback Engine",
    version     = "5.0.0",
    lifespan    = lifespan,
)
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])


# ═══════════════════════════════════════════════════════════════════════════
# Module 01 — Whisper
# ═══════════════════════════════════════════════════════════════════════════
def run_whisper(audio_path: str) -> dict:
    t0 = time.time()
    result = WHISPER_MODEL.transcribe(audio_path, fp16=(DEVICE=="cuda"),
                                      language="en", verbose=False)
    transcript = result["text"].strip()
    segments   = [{"id":s["id"],"start":round(s["start"],2),
                   "end":round(s["end"],2),"text":s["text"].strip()}
                  for s in result.get("segments",[])]
    duration_s = segments[-1]["end"] if segments else 0.0
    return {
        "transcript": transcript, "language": result.get("language","en"),
        "word_count": len(transcript.split()), "duration_s": round(duration_s,2),
        "segments": segments, "processing_time_s": round(time.time()-t0,2),
        "device_used": DEVICE.upper(),
    }


# ═══════════════════════════════════════════════════════════════════════════
# Module 02 — Librosa
# ═══════════════════════════════════════════════════════════════════════════
def run_librosa(wav_path: str) -> dict:
    t0 = time.time()
    y, sr = librosa.load(wav_path, sr=16000, mono=True)
    dur   = librosa.get_duration(y=y, sr=sr)

    f0, vf_flag, _ = librosa.pyin(y, fmin=librosa.note_to_hz("C2"),
                                   fmax=librosa.note_to_hz("C7"), sr=sr)
    vf = f0[vf_flag] if vf_flag is not None and vf_flag.any() else np.array([120.0])
    vf = vf[~np.isnan(vf)]
    if len(vf) == 0: vf = np.array([120.0])
    mean_hz  = float(np.mean(vf)); std_hz = float(np.std(vf))
    range_hz = float(np.max(vf)-np.min(vf))
    var_sc   = min(100.0, round((std_hz/(mean_hz+1e-6))*300, 1))

    rms      = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    mean_rms = float(np.mean(rms)); max_rms = float(np.max(rms))
    eng_sc   = min(100.0, round(mean_rms*800, 1))

    intervals   = librosa.effects.split(y, top_db=35, frame_length=2048, hop_length=512)
    sp_samp     = sum(e-s for s,e in intervals)
    sp_dur      = sp_samp/sr; sil_dur = max(0.0, dur-sp_dur)
    sil_rat     = round(sil_dur/max(dur,1e-6)*100, 1)
    pauses, prev = [], 0
    for s,e in intervals:
        if (s-prev)/sr > 0.3: pauses.append(round((s-prev)/sr,2))
        prev = e
    wpm = int(np.clip(round(sp_dur*1.67*60/max(dur,1e-6)),60,220)) if sp_dur>0 else 0

    flat  = librosa.feature.spectral_flatness(y=y, hop_length=512)[0]
    stab  = min(100.0, round((1.0-float(np.mean(flat)))*100, 1))
    cent  = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=512)[0]
    zcr   = librosa.feature.zero_crossing_rate(y=y, hop_length=512)[0]

    pitch_sc  = min(100.0, max(0.0, round(100-abs(var_sc-35)*1.2, 1)))
    rhythm_sc = min(100.0, max(0.0, round(100-abs(wpm-140)/1.5-min(20,len(pauses)*2), 1)))
    clarity   = min(100.0, max(0.0, round(eng_sc*.30+rhythm_sc*.30+pitch_sc*.20+stab*.20, 1)))
    conf_lbl  = "High" if clarity>=75 else "Medium" if clarity>=50 else "Low"

    return {
        "duration_s": round(dur,2), "sample_rate": 16000,
        "pitch":  {"mean_hz":round(mean_hz,1),"std_hz":round(std_hz,1),
                   "range_hz":round(range_hz,1),"variation_score":var_sc},
        "energy": {"mean_rms":round(mean_rms,4),"max_rms":round(max_rms,4),"energy_score":eng_sc},
        "rhythm": {"estimated_wpm":wpm,"speech_duration_s":round(sp_dur,2),
                   "silence_duration_s":round(sil_dur,2),"silence_ratio":sil_rat,
                   "pause_count":len(pauses),
                   "avg_pause_s":round(float(np.mean(pauses)) if pauses else 0.0,2),
                   "max_pause_s":round(float(np.max(pauses))  if pauses else 0.0,2)},
        "voice_quality": {"voice_stability":stab,
                          "spectral_centroid":round(float(np.mean(cent)),1),
                          "zero_crossing_rate":round(float(np.mean(zcr)),4)},
        "scores": {"pitch_score":pitch_sc,"energy_score":eng_sc,
                   "rhythm_score":rhythm_sc,"stability_score":stab,
                   "delivery_clarity":clarity,"confidence_label":conf_lbl},
        "processing_time_s": round(time.time()-t0,2),
    }


# ═══════════════════════════════════════════════════════════════════════════
# Module 03 — NLP
# ═══════════════════════════════════════════════════════════════════════════
def run_nlp(transcript: str, question: str, category: str) -> dict:
    from sklearn.metrics.pairwise import cosine_similarity
    t0 = time.time()

    if not transcript.strip():
        return {"relevance_score":0.0,"content_quality_score":0.0,
                "similarity_to_question":0.0,"similarity_to_ideal":0.0,
                "fluency_score":0.0,"grammar_score":0.0,"clarity_score":0.0,
                "vocabulary_score":0.0,"word_count":0,"sentence_count":0,
                "avg_sentence_length":0.0,"type_token_ratio":0.0,
                "filler_word_count":0,"filler_words_found":[],"named_entities":[],
                "nlp_overall_score":0.0,"processing_time_s":0.0}

    ideal   = IDEAL_ANSWERS.get(category, IDEAL_ANSWERS["Personal"])
    embeds  = ST_MODEL.encode([transcript, question, ideal], show_progress_bar=False)
    sim_q   = float(cosine_similarity([embeds[0]],[embeds[1]])[0][0])
    sim_i   = float(cosine_similarity([embeds[0]],[embeds[2]])[0][0])
    rel_sc  = round(min(100.0, sim_q*130), 1)
    cq_sc   = round(min(100.0, (sim_q*.5+sim_i*.5)*130), 1)

    doc       = SPACY_NLP(transcript)
    sentences = list(doc.sents)
    words     = [t for t in doc if t.is_alpha]
    wc        = len(words); sc = max(len(sentences),1)
    avg_sl    = round(wc/sc, 1)
    dep_types = set(t.dep_ for t in doc if not t.is_space)
    gram_div  = min(100.0, round(len(dep_types)/20*100, 1))
    verb_rat  = sum(1 for s in sentences if any(t.pos_=="VERB" for t in s)) / sc
    gram_sc   = min(100.0, round(verb_rat*70+gram_div*.30, 1))
    entities  = [{"text":e.text,"label":e.label_} for e in doc.ents][:10]

    wl       = [w.text.lower() for w in words]
    ttr      = round(len(set(wl))/max(len(wl),1), 3)
    vocab_sc = min(100.0, round(ttr*150, 1))

    txt_low    = transcript.lower()
    found_fw   = [fw for fw in FILLER_WORDS if re.search(r'\b'+re.escape(fw)+r'\b', txt_low)]
    filler_cnt = sum(len(re.findall(r'\b'+re.escape(fw)+r'\b', txt_low)) for fw in found_fw)

    sent_pen   = abs(avg_sl-15)*1.5
    filler_pen = min(30, filler_cnt*5)
    flu_sc     = min(100.0, max(0.0, round(gram_div*.35+vocab_sc*.35+(100-sent_pen)*.15+(100-filler_pen)*.15, 1)))
    clar_sc    = round((flu_sc+gram_sc)/2, 1)
    overall    = round(min(100.0, max(0.0, cq_sc*.40+flu_sc*.25+gram_sc*.20+vocab_sc*.15)), 1)

    return {
        "relevance_score":rel_sc,"content_quality_score":cq_sc,
        "similarity_to_question":round(sim_q,3),"similarity_to_ideal":round(sim_i,3),
        "fluency_score":flu_sc,"grammar_score":gram_sc,"clarity_score":clar_sc,
        "vocabulary_score":vocab_sc,"word_count":wc,"sentence_count":sc,
        "avg_sentence_length":avg_sl,"type_token_ratio":ttr,
        "filler_word_count":filler_cnt,"filler_words_found":found_fw,
        "named_entities":entities,"nlp_overall_score":overall,
        "processing_time_s":round(time.time()-t0,2),
    }


# ═══════════════════════════════════════════════════════════════════════════
# Module 04 — Facial Analysis (per frame)
# Uses: DeepFace (TF 2.13 + deepface 0.0.86) + MediaPipe Face Mesh
# Required: tensorflow==2.13.0, deepface==0.0.86, tf-keras==2.13.0
# ═══════════════════════════════════════════════════════════════════════════

def analyze_frame(frame_b64: str) -> dict:
    """
    Accepts a base64 JPEG frame from the browser webcam.
    Runs DeepFace (emotions) + MediaPipe (eye contact, head pose).
    Returns per-frame scores.

    DeepFace 0.0.86 import style:
        from deepface.DeepFace import analyze as deepface_analyze
    """
    import mediapipe as mp
    from deepface.DeepFace import analyze as deepface_analyze

    result = {
        "face_detected": False, "dominant_emotion": "neutral",
        "emotions": {}, "confidence_score": 50.0,
        "stress_level": 30.0, "eye_contact_score": 50.0,
        "behavioral_stability": 50.0, "error": None,
    }

    try:
        img_bytes = base64.b64decode(frame_b64)
        img_arr   = np.frombuffer(img_bytes, dtype=np.uint8)
        frame     = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
        if frame is None:
            result["error"] = "Invalid frame data"; return result

        # ── DeepFace emotions ─────────────────────────────────────────
        try:
            analysis = deepface_analyze(
                frame,
                actions           = ["emotion"],
                enforce_detection = False,
                silent            = True,
            )
            # deepface 0.0.86 returns a list
            if isinstance(analysis, list):
                analysis = analysis[0]

            raw_emos         = analysis.get("emotion", {})
            dominant_emotion = analysis.get("dominant_emotion", "neutral")

            # Normalise all 7 keys to 0-100
            emo_keys = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]
            emotions = {k: round(float(raw_emos.get(k, 0.0)), 1) for k in emo_keys}

            result["emotions"]         = emotions
            result["dominant_emotion"] = dominant_emotion
            result["face_detected"]    = True

            # Confidence: reward neutral + happy, penalise fear/sad/angry
            conf = (emotions.get("neutral", 0) * .40
                  + emotions.get("happy",   0) * .40
                  - emotions.get("fear",    0) * .50
                  - emotions.get("angry",   0) * .30
                  - emotions.get("sad",     0) * .30)
            result["confidence_score"] = round(min(100, max(0, 50 + conf * .5)), 1)

            # Stress: weighted negative emotions
            stress = (emotions.get("fear",    0) * .40
                    + emotions.get("sad",     0) * .30
                    + emotions.get("angry",   0) * .20
                    + emotions.get("disgust", 0) * .10)
            result["stress_level"] = round(min(100, max(0, stress)), 1)

        except Exception as e:
            result["error"] = f"DeepFace: {str(e)}"

        # ── MediaPipe iris / head pose ────────────────────────────────
        try:
            mp_fm = mp.solutions.face_mesh
            rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            with mp_fm.FaceMesh(static_image_mode=True, refine_landmarks=True,
                                max_num_faces=1, min_detection_confidence=0.5) as fm:
                res = fm.process(rgb)

            if res.multi_face_landmarks:
                lm = res.multi_face_landmarks[0].landmark
                result["face_detected"] = True

                # Iris deviation from eye centre → eye contact score
                li_x = lm[468].x; ri_x = lm[473].x
                lc   = (lm[33].x  + lm[133].x) / 2
                rc   = (lm[362].x + lm[263].x) / 2
                dev  = (abs(li_x - lc) + abs(ri_x - rc)) / 2
                result["eye_contact_score"] = round(max(0, min(100, (1 - dev * 20) * 100)), 1)

                # Head pose: nose tip horizontal deviation from centre
                nose_dev = abs(lm[1].x - 0.5)
                result["behavioral_stability"] = round(max(0, min(100, (1 - nose_dev * 4) * 100)), 1)

        except Exception as e:
            if result["error"]: result["error"] += f" | MediaPipe: {str(e)}"
            else: result["error"] = f"MediaPipe: {str(e)}"

    except Exception as e:
        result["error"] = str(e)

    return result


def aggregate_facial_session(frames: list) -> dict:
    """Average all per-frame scores into a session-level report."""
    t0 = time.time()
    if not frames:
        return {
            "frame_count":0,"face_detected_ratio":0.0,
            "confidence_score":50.0,"stress_level":30.0,
            "eye_contact_score":50.0,"behavioral_stability":50.0,
            "dominant_emotion":"neutral","emotions":{},
            "processing_time_s":0.0,
        }

    detected = [f for f in frames if f.get("face_detected")]
    ratio    = round(len(detected)/len(frames)*100, 1)

    def avg(key): return round(float(np.mean([f[key] for f in detected])), 1) if detected else 50.0

    # Aggregate emotion totals
    emo_totals: dict = {}
    for f in detected:
        for e, v in f.get("emotions", {}).items():
            emo_totals[e] = emo_totals.get(e,0) + v
    emo_means = {k: round(v/len(detected),1) for k,v in emo_totals.items()} if detected else {}
    dominant  = max(emo_means, key=emo_means.get) if emo_means else "neutral"

    return {
        "frame_count":          len(frames),
        "face_detected_ratio":  ratio,
        "confidence_score":     avg("confidence_score"),
        "stress_level":         avg("stress_level"),
        "eye_contact_score":    avg("eye_contact_score"),
        "behavioral_stability": avg("behavioral_stability"),
        "dominant_emotion":     dominant,
        "emotions":             emo_means,
        "processing_time_s":    round(time.time()-t0, 2),
    }


# ═══════════════════════════════════════════════════════════════════════════
# Module 05 — Feedback Engine
# Aggregates scores from M01-M04 → overall score, grade, strengths,
# improvements, actionable tips, priority focus area
# ═══════════════════════════════════════════════════════════════════════════

def _grade(score: float) -> str:
    if score >= 90: return "A+"
    if score >= 80: return "A"
    if score >= 70: return "B"
    if score >= 60: return "C"
    if score >= 50: return "D"
    return "F"

def _dim_feedback(label: str, score: float) -> str:
    level = "excellent" if score>=80 else "good" if score>=65 else "fair" if score>=50 else "needs work"
    msgs = {
        "Content Relevance": {
            "excellent": "Answer directly addresses the question with strong examples.",
            "good":      "Answer is mostly on-topic with relevant points.",
            "fair":      "Answer partially addresses the question — add more specifics.",
            "needs work":"Answer drifts from the question — stay focused on what was asked.",
        },
        "Language Quality": {
            "excellent": "Rich vocabulary, clear sentences, minimal filler words.",
            "good":      "Language is clear with some room to improve variety.",
            "fair":      "Several filler words or short sentences reduce clarity.",
            "needs work":"High filler word usage and weak sentence structure detected.",
        },
        "Voice Delivery": {
            "excellent": "Great pacing, energy, and pitch variation — sounds confident.",
            "good":      "Delivery is solid with minor pacing or energy dips.",
            "fair":      "Pacing or energy could be more consistent.",
            "needs work":"Monotone or very fast/slow speech affects listener engagement.",
        },
        "Facial Presence": {
            "excellent": "Strong eye contact and calm, confident expression throughout.",
            "good":      "Good presence with occasional breaks in eye contact.",
            "fair":      "Some stress or inconsistent eye contact — try to relax.",
            "needs work":"Low eye contact or high stress detected — face the camera more.",
        },
        "Speech Fluency": {
            "excellent": "Smooth, well-paced speech with natural pauses.",
            "good":      "Mostly fluent with minor hesitations.",
            "fair":      "Noticeable hesitations or awkward pauses.",
            "needs work":"Frequent pauses or filler words interrupt your flow.",
        },
    }
    return msgs.get(label, {}).get(level, f"{label} score: {round(score)}/100")


def run_feedback(stt: dict, audio: dict, nlp: dict, facial: dict) -> dict:
    t0 = time.time()

    # ── Pull key scores from each module ─────────────────────────────
    content_score  = float(nlp.get("content_quality_score", 50))
    relevance_sc   = float(nlp.get("relevance_score", 50))
    language_score = float(nlp.get("nlp_overall_score", 50))
    fluency_score  = float(nlp.get("fluency_score", 50))
    grammar_score  = float(nlp.get("grammar_score", 50))
    vocab_score    = float(nlp.get("vocabulary_score", 50))
    filler_count   = int(nlp.get("filler_word_count", 0))
    filler_words   = nlp.get("filler_words_found", [])
    word_count     = int(nlp.get("word_count", 0))
    avg_sent_len   = float(nlp.get("avg_sentence_length", 15))
    ttr            = float(nlp.get("type_token_ratio", 0.5))

    delivery_sc    = float(audio.get("scores", {}).get("delivery_clarity", 50))
    pitch_sc       = float(audio.get("scores", {}).get("pitch_score", 50))
    energy_sc      = float(audio.get("scores", {}).get("energy_score", 50))
    rhythm_sc      = float(audio.get("scores", {}).get("rhythm_score", 50))
    stability_sc   = float(audio.get("scores", {}).get("stability_score", 50))
    wpm            = int(audio.get("rhythm", {}).get("estimated_wpm", 130))
    pause_count    = int(audio.get("rhythm", {}).get("pause_count", 0))
    mean_hz        = float(audio.get("pitch", {}).get("mean_hz", 150))
    var_score      = float(audio.get("pitch", {}).get("variation_score", 30))

    conf_score     = float(facial.get("confidence_score", 50))
    stress_level   = float(facial.get("stress_level", 30))
    eye_contact    = float(facial.get("eye_contact_score", 50))
    stability_fac  = float(facial.get("behavioral_stability", 50))
    dominant_emo   = facial.get("dominant_emotion", "neutral")
    frame_count    = int(facial.get("frame_count", 0))
    face_ratio     = float(facial.get("face_detected_ratio", 0))

    duration_s     = float(audio.get("duration_s", 0))

    # ── 5 Dimensions ─────────────────────────────────────────────────
    content_dim  = round((content_score * 0.60 + relevance_sc * 0.40), 1)
    language_dim = round((language_score * 0.40 + fluency_score * 0.30 + grammar_score * 0.20 + vocab_score * 0.10), 1)
    delivery_dim = round((delivery_sc * 0.40 + rhythm_sc * 0.30 + energy_sc * 0.20 + pitch_sc * 0.10), 1)
    facial_dim   = round(((conf_score * 0.40 + eye_contact * 0.40 + stability_fac * 0.20) * (1 - stress_level/200)), 1)
    facial_dim   = min(100, max(0, facial_dim))
    fluency_dim  = round((fluency_score * 0.50 + (100 - min(filler_count * 8, 50)) * 0.30 + rhythm_sc * 0.20), 1)

    # Penalise very short answers
    if word_count < 30:
        length_pen = (30 - word_count) * 1.5
        content_dim  = max(0, content_dim  - length_pen)
        language_dim = max(0, language_dim - length_pen * 0.5)

    dims = [
        ("Content Relevance", content_dim,  0.30),
        ("Language Quality",  language_dim, 0.20),
        ("Voice Delivery",    delivery_dim, 0.20),
        ("Facial Presence",   facial_dim,   0.15),
        ("Speech Fluency",    fluency_dim,  0.15),
    ]

    overall = round(sum(s * w for _, s, w in dims), 1)
    overall = min(100, max(0, overall))

    dimension_objs = [
        DimensionScore(
            label=l, score=round(s,1), weight=round(w*100),
            grade=_grade(s), feedback=_dim_feedback(l, s)
        ) for l, s, w in dims
    ]

    # ── Strengths ─────────────────────────────────────────────────────
    strengths = []
    if content_dim >= 70:
        strengths.append(f"Strong answer relevance — your response scored {round(content_dim)}/100 on content quality.")
    if language_dim >= 70:
        strengths.append(f"Good language quality — clear vocabulary with a type-token ratio of {ttr:.2f}.")
    if delivery_dim >= 70:
        strengths.append(f"Confident voice delivery — speaking at {wpm} WPM with good energy.")
    if eye_contact >= 70:
        strengths.append(f"Strong eye contact — maintained camera presence {round(eye_contact)}% of the time.")
    if filler_count == 0:
        strengths.append("Zero filler words detected — very clean and professional speech.")
    elif filler_count <= 2:
        strengths.append(f"Minimal filler words — only {filler_count} detected across your answer.")
    if var_score >= 25 and var_score <= 65:
        strengths.append("Natural pitch variation — your voice sounds expressive and engaging.")
    if pause_count <= 3 and duration_s > 10:
        strengths.append("Smooth flow with minimal unnecessary pauses.")
    if word_count >= 80:
        strengths.append(f"Detailed answer — {word_count} words shows thorough thinking.")
    if dominant_emo in ("happy", "neutral") and conf_score >= 65:
        strengths.append(f"Positive facial expression — projected {dominant_emo} confidence throughout.")
    if not strengths:
        strengths.append("You completed the answer — keep practising to build on this foundation.")

    # ── Improvements ──────────────────────────────────────────────────
    improvements = []
    if content_dim < 60:
        improvements.append(f"Content relevance is low ({round(content_dim)}/100) — structure your answer around the exact question asked.")
    if filler_count > 4:
        improvements.append(f"Too many filler words ({filler_count} detected: {', '.join(filler_words[:4])}) — replace them with a brief pause.")
    if wpm > 170:
        improvements.append(f"Speaking too fast at {wpm} WPM — aim for 120–150 WPM for clarity.")
    elif wpm < 100:
        improvements.append(f"Speaking too slowly at {wpm} WPM — pick up the pace to maintain engagement.")
    if energy_sc < 45:
        improvements.append("Voice energy is low — project more with your diaphragm and speak with conviction.")
    if eye_contact < 50 and frame_count > 0:
        improvements.append(f"Eye contact score is {round(eye_contact)}/100 — look directly into the camera lens.")
    if stress_level > 55:
        improvements.append(f"Elevated stress detected ({round(stress_level)}%) — try slow breathing before answering.")
    if word_count < 40:
        improvements.append(f"Answer is too short ({word_count} words) — aim for at least 60–80 words per answer.")
    if avg_sent_len > 35:
        improvements.append("Sentences are too long — break them into shorter, punchier points.")
    if var_score < 15:
        improvements.append("Voice is monotone — vary your pitch to emphasise key points.")
    if pause_count > 8:
        improvements.append(f"{pause_count} pauses detected — practice your answer to reduce hesitation.")
    if not improvements:
        improvements.append("Keep refining your answers — small polish can push your score higher.")

    # ── Actionable Tips ───────────────────────────────────────────────
    tips = []

    # Content tips
    if content_dim < 70:
        tips.append("Use the STAR method: Situation → Task → Action → Result to structure behavioral answers.")
    if relevance_sc < 65:
        tips.append("Before answering, repeat the question in your head and identify the core skill being tested.")

    # Language tips
    if filler_count > 3:
        tips.append("Record yourself speaking for 60 seconds and count fillers — awareness alone reduces them by 40%.")
    if vocab_score < 55:
        tips.append("Expand vocabulary by reading industry articles — aim to use 2-3 precise domain-specific words per answer.")
    if grammar_score < 60:
        tips.append("Practice speaking in complete sentences — avoid starting answers with 'So...' or 'Basically...'")

    # Delivery tips
    if wpm > 160:
        tips.append("Place a sticky note 'SLOW DOWN' on your monitor — nerves naturally speed up speech.")
    if energy_sc < 50:
        tips.append("Stand up while practising answers — posture directly affects vocal energy and confidence.")
    if var_score < 20:
        tips.append("Underline key words in your answer notes and consciously emphasise them when speaking.")

    # Facial tips
    if eye_contact < 60:
        tips.append("Stick a small sticker just above your webcam lens — it gives you a natural focal point.")
    if stress_level > 50:
        tips.append("Use the 4-7-8 breathing technique before interviews: inhale 4s, hold 7s, exhale 8s.")
    if face_ratio < 50 and frame_count > 0:
        tips.append("Ensure your face fills at least 50% of the frame — sit closer to the camera.")

    # General
    tips.append("Record a full mock interview weekly — reviewing your own footage accelerates improvement faster than practice alone.")
    tips = tips[:6]  # cap at 6 tips

    # ── Priority focus ─────────────────────────────────────────────────
    dim_scores = {l: s for l, s, _ in dims}
    weakest    = min(dim_scores, key=dim_scores.get)
    priority_map = {
        "Content Relevance": "Focus on structuring your answer using STAR method — content quality is your biggest lever.",
        "Language Quality":  "Work on reducing filler words and building vocabulary — clearer language = stronger impression.",
        "Voice Delivery":    "Practise pacing and energy — record yourself and adjust speaking rate to 120-150 WPM.",
        "Facial Presence":   "Improve eye contact — look into the camera lens and practise staying calm under pressure.",
        "Speech Fluency":    "Reduce hesitations by rehearsing answers aloud 3× before interviews.",
    }
    priority = priority_map.get(weakest, f"Focus on improving {weakest}.")

    return {
        "overall_score":     overall,
        "grade":             _grade(overall),
        "verdict":           (
            "Outstanding performance — interview-ready!" if overall >= 88 else
            "Strong performance with minor areas to polish." if overall >= 75 else
            "Good foundation — focused practice will make a big difference." if overall >= 62 else
            "Developing — consistent practice needed across multiple areas." if overall >= 48 else
            "Early stage — keep practising, every attempt builds skill."
        ),
        "dimensions":        [d.dict() for d in dimension_objs],
        "strengths":         strengths[:5],
        "improvements":      improvements[:5],
        "tips":              tips,
        "priority_focus":    priority,
        "processing_time_s": round(time.time() - t0, 2),
    }


# ═══════════════════════════════════════════════════════════════════════════
# Routes
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/health", response_model=HealthResponse, tags=["Status"])
async def health():
    return HealthResponse(
        status="ok", whisper_model="whisper-base", device=DEVICE.upper(),
        gpu=torch.cuda.is_available(),
        gpu_name=torch.cuda.get_device_name(0) if torch.cuda.is_available() else "N/A",
        ffmpeg_ok=_ffmpeg_ok(), librosa_version=librosa.__version__,
        spacy_model="en_core_web_sm", sentence_transformer="all-MiniLM-L6-v2",
    )


@app.get("/api/questions", response_model=QuestionsResponse, tags=["Questions"])
async def get_questions():
    qs = [
        {"id":1, "category":"Personal",    "question":"Tell me about yourself."},
        {"id":2, "category":"Personal",    "question":"What is your greatest strength?"},
        {"id":3, "category":"Personal",    "question":"What is your greatest weakness?"},
        {"id":4, "category":"Behavioral",  "question":"Describe a time you handled a difficult situation at work."},
        {"id":5, "category":"Behavioral",  "question":"Tell me about a time you worked in a team to achieve a goal."},
        {"id":6, "category":"Behavioral",  "question":"Give an example of a goal you achieved under pressure."},
        {"id":7, "category":"Technical",   "question":"How do you approach debugging a complex technical problem?"},
        {"id":8, "category":"Technical",   "question":"Explain a technical project you are most proud of."},
        {"id":9, "category":"Situational", "question":"How would you handle a disagreement with your manager?"},
        {"id":10,"category":"Situational", "question":"What would you do if you missed an important deadline?"},
    ]
    return QuestionsResponse(questions=[QuestionItem(**q) for q in qs])


@app.post("/api/frame", response_model=FrameResult, tags=["Facial"])
async def process_frame(
    frame:      str = Form(..., description="Base64 JPEG webcam frame"),
    session_id: str = Form(default="default"),
):
    """
    Accepts a single base64 JPEG webcam frame.
    Runs DeepFace + MediaPipe and stores result in session accumulator.
    Called every ~2.5s from the frontend during recording.
    """
    loop   = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, analyze_frame, frame)

    if result.get("face_detected"):
        with _session_lock:
            if session_id not in _facial_sessions:
                _facial_sessions[session_id] = []
            _facial_sessions[session_id].append(result)

    return FrameResult(**result)


@app.post("/api/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
async def analyze(
    audio_file: UploadFile = File(...),
    question:   str        = Form(default="Tell me about yourself."),
    category:   str        = Form(default="Personal"),
    session_id: str        = Form(default="default"),
):
    """
    Runs all 4 modules on a single audio upload + accumulated webcam session:
    - M01 Whisper + M02 Librosa  → parallel
    - M03 NLP                    → after M01 (needs transcript)
    - M04 Facial                 → aggregates frames collected during recording
    """
    if not _ffmpeg_ok():
        raise HTTPException(status_code=500,
            detail="FFmpeg not found. Add C:\\ffmpeg\\bin to PATH.")

    ct     = audio_file.content_type or ""
    suffix = (".webm" if "webm" in ct else ".wav" if "wav" in ct
              else ".mp3" if "mp3" in ct else ".webm")

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio_file.read())
        orig_path = tmp.name

    extra_file = None
    try:
        t_total = time.time()

        if suffix != ".wav":
            wav_path = _to_wav(orig_path); extra_file = wav_path
        else:
            wav_path = orig_path

        loop = asyncio.get_event_loop()

        # M01 + M02 parallel
        stt_data, audio_data = await asyncio.gather(
            loop.run_in_executor(None, run_whisper, wav_path),
            loop.run_in_executor(None, run_librosa, wav_path),
        )

        # M03 after M01
        nlp_data = await loop.run_in_executor(
            None, run_nlp, stt_data["transcript"], question, category
        )

        # M04 — pull & clear session frames
        with _session_lock:
            frames = _facial_sessions.pop(session_id, [])
        facial_data = aggregate_facial_session(frames)

        # M05 — Feedback Engine (uses all 4 module outputs)
        feedback_data = run_feedback(stt_data, audio_data, nlp_data, facial_data)

        return AnalyzeResponse(
            question=question, category=category,
            stt=STTResult(**stt_data), audio=AudioResult(**audio_data),
            nlp=NLPResult(**nlp_data), facial=FacialResult(**facial_data),
            feedback=FeedbackResult(**feedback_data),
            total_time_s=round(time.time()-t_total, 2),
        )

    except subprocess.CalledProcessError:
        raise HTTPException(status_code=500, detail="FFmpeg conversion failed.")
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(orig_path)
        if extra_file and os.path.exists(extra_file):
            os.unlink(extra_file)