import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/QuizDetail.css";

// ── Palette state constants ───────────────────────────────────────────────────
const S = {
  NOT_VISITED:  "nv",
  NOT_ANSWERED: "na",
  ANSWERED:     "ans",
};

const palClass = (s) => {
  switch (s) {
    case S.ANSWERED:     return "answered";
    case S.NOT_ANSWERED: return "not-answered";
    default:             return "not-visited";
  }
};

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

// ── Seeded shuffle ────────────────────────────────────────────────────────────
// Uses a simple deterministic shuffle so the same seed always produces
// the same order — stable across page refreshes for the same attempt.
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

function shuffleWithSeed(arr, seed) {
  const rng = seededRandom(seed);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Generate a numeric seed from a string (quiz id + attempt number)
function makeSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Shuffle questions and their choices, storing the order in localStorage
// so refreshing the page gives the same order for the same attempt.
function getShuffledQuestions(questions, quizId, attemptKey) {
  const storageKey = `quiz_${quizId}_${attemptKey}_order`;
  let orderMap = null;

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) orderMap = JSON.parse(stored);
  } catch {}

  if (!orderMap) {
    // First time: generate seeds and store them
    const seed = makeSeed(`${quizId}_${attemptKey}`);
    const shuffledQuestions = shuffleWithSeed(questions, seed);

    orderMap = {
      questionOrder: shuffledQuestions.map((q) => q.id),
      choiceOrders: {},
    };

    shuffledQuestions.forEach((q, qi) => {
      const choiceSeed = makeSeed(`${quizId}_${attemptKey}_q${q.id}_${qi}`);
      const shuffledChoices = shuffleWithSeed(q.choices, choiceSeed);
      orderMap.choiceOrders[q.id] = shuffledChoices.map((c) => c.id);
    });

    try {
      localStorage.setItem(storageKey, JSON.stringify(orderMap));
    } catch {}
  }

  // Apply the stored order
  const questionById = Object.fromEntries(questions.map((q) => [q.id, q]));
  return orderMap.questionOrder
    .map((qId) => {
      const q = questionById[qId];
      if (!q) return null;
      const choiceById = Object.fromEntries(q.choices.map((c) => [c.id, c]));
      const orderedChoices = orderMap.choiceOrders[q.id]
        ?.map((cId) => choiceById[cId])
        .filter(Boolean) || q.choices;
      return { ...q, choices: orderedChoices };
    })
    .filter(Boolean);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function QuizDetail() {
  const navigate = useNavigate();
  const { subjectId, quizId } = useParams();

  const [quizData, setQuizData]           = useState(null);
  const [shuffledQuestions, setShuffled]  = useState([]);
  const [answers, setAnswers]             = useState({});
  const [currentIndex, setCurrentIndex]  = useState(0);
  const [loading, setLoading]            = useState(true);
  const [submitting, setSubmitting]      = useState(false);
  const [error, setError]                = useState(null);
  const [timeLeft, setTimeLeft]          = useState(null);
  const [palette, setPalette]            = useState({});
  const [showExitModal, setShowExitModal] = useState(false);
  const [tabWarning, setTabWarning]      = useState(false); // tab-switch warning banner
  const [quizReady, setQuizReady]        = useState(false);

  const answersRef   = useRef({});
  const submittedRef = useRef(false);
  const durationRef  = useRef(null);
  const startTimeRef = useRef(null);
  const attemptKeyRef = useRef("1"); // will be set to attempt_number from backend

  // ── fetch + start ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function initQuiz() {
      try {
        setLoading(true);
        setError(null);

        // Backend returns existing PENDING attempt or creates new one
        let attemptNumber = "1";
        try {
          const startRes = await api.post(`/quizzes/${quizId}/start/`);
          // Backend now returns attempt_id — use it as the shuffle seed key
          if (startRes.data?.attempt_id) {
            attemptNumber = String(startRes.data.attempt_id).slice(-8);
          }
        } catch (err) {
          const msg = err.response?.data?.detail;
          if (msg) { setError(msg); setLoading(false); return; }
        }
        attemptKeyRef.current = attemptNumber;

        const res = await api.get(`/quizzes/${quizId}/`);
        setQuizData(res.data);

        // Shuffle questions and choices using attempt-specific seed
        const shuffled = getShuffledQuestions(
          res.data.questions,
          quizId,
          attemptNumber
        );
        setShuffled(shuffled);

        // Initialise palette
        const init = {};
        shuffled.forEach((q, i) => {
          init[q.id] = i === 0 ? S.NOT_ANSWERED : S.NOT_VISITED;
        });
        setPalette(init);

        // Timer
        let st = localStorage.getItem(`quiz_${quizId}_start`);
        if (!st) {
          st = Date.now();
          localStorage.setItem(`quiz_${quizId}_start`, String(st));
        } else {
          st = parseInt(st, 10);
        }
        startTimeRef.current = st;
        durationRef.current = (res.data.time_limit_minutes || 5) * 60;

        const elapsed = Math.floor((Date.now() - st) / 1000);
        setTimeLeft(Math.max(0, durationRef.current - elapsed));
        setQuizReady(true);
      } catch (err) {
        setError(err.response?.data?.detail || "Unable to load quiz.");
      } finally {
        setLoading(false);
      }
    }
    if (quizId) initQuiz();
  }, [quizId]);

  // ── Tab-switch detection ───────────────────────────────────────────────────
  // Shows a warning banner when the student switches tabs/minimises window.
  // Does NOT pause the timer (timer runs on wall-clock time, not ticks).
  // Does NOT show a re-entry popup — just the banner so they know we noticed.
  useEffect(() => {
    if (!quizReady) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Student left the tab — nothing to pause, timer keeps running
        // We just record it so we can show a warning on return
      } else {
        // Student came back — show warning banner
        setTabWarning(true);
        // Auto-dismiss after 5 seconds
        setTimeout(() => setTabWarning(false), 5000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [quizReady]);

  // ── Auto-submit ────────────────────────────────────────────────────────────
  const handleAutoSubmit = useCallback(async () => {
    try {
      const formatted = Object.entries(answersRef.current).map(([q, c]) => ({
        question: q, selected_choice: c,
      }));
      await api.post(`/student/quizzes/${quizId}/submit/`, { answers: formatted });
      localStorage.removeItem(`quiz_${quizId}_start`);
      navigate(`/subjects/quiz/${subjectId}/result/${quizId}`);
    } catch (err) {
      // Retry once
      setTimeout(async () => {
        try {
          const formatted = Object.entries(answersRef.current).map(([q, c]) => ({
            question: q, selected_choice: c,
          }));
          await api.post(`/student/quizzes/${quizId}/submit/`, { answers: formatted });
          localStorage.removeItem(`quiz_${quizId}_start`);
          navigate(`/subjects/quiz/${subjectId}/result/${quizId}`);
        } catch (retryErr) {
          console.error("Auto submit retry failed", retryErr);
        }
      }, 2000);
    }
  }, [quizId, subjectId, navigate]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!quizReady) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = durationRef.current - elapsed;

      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        if (!submittedRef.current) {
          submittedRef.current = true;
          handleAutoSubmit();
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quizReady, handleAutoSubmit]);

  const fmtTime = (s) => {
    const h   = String(Math.floor(s / 3600)).padStart(2, "0");
    const m   = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const isLowTime = timeLeft !== null && timeLeft <= 60;

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goTo = (idx) => {
    const qId = shuffledQuestions[idx].id;
    setPalette(p => ({
      ...p,
      [qId]: p[qId] === S.NOT_VISITED ? S.NOT_ANSWERED : p[qId],
    }));
    setCurrentIndex(idx);
  };

  const handleAnswerChange = (questionId, choiceId) => {
    setAnswers(prev => {
      const updated = { ...prev, [questionId]: choiceId };
      answersRef.current = updated;
      return updated;
    });
    setPalette(p => ({ ...p, [questionId]: S.ANSWERED }));
  };

  const handleClearResponse = () => {
    const qId = shuffledQuestions[currentIndex].id;
    setAnswers(prev => {
      const n = { ...prev };
      delete n[qId];
      answersRef.current = n;
      return n;
    });
    setPalette(p => ({ ...p, [qId]: S.NOT_ANSWERED }));
  };

  const handlePrevious = () => { if (currentIndex > 0) goTo(currentIndex - 1); };
  const handleNext = () => {
    if (currentIndex < shuffledQuestions.length - 1) goTo(currentIndex + 1);
  };

  const handleExitQuiz = () => {
    localStorage.removeItem(`quiz_${quizId}_start`);
    navigate(`/subjects/quiz/${subjectId}`);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const unanswered = shuffledQuestions.filter(
      (qq) => answers[qq.id] === undefined
    ).length;

    if (unanswered > 0) {
      const confirmed = window.confirm(
        `You have ${unanswered} unanswered question(s). Submit anyway?\nUnanswered questions will be scored 0.`
      );
      if (!confirmed) return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const formatted = Object.entries(answers).map(([q, c]) => ({
        question: q, selected_choice: c,
      }));
      await api.post(`/student/quizzes/${quizId}/submit/`, { answers: formatted });
      localStorage.removeItem(`quiz_${quizId}_start`);
      submittedRef.current = true;
      navigate(`/subjects/quiz/${subjectId}/result/${quizId}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <div className="quiz-center">Loading quiz…</div>;
  if (error && !quizData) return <div className="quiz-center quiz-error-full">{error}</div>;
  if (!quizData || shuffledQuestions.length === 0) return null;

  const q    = shuffledQuestions[currentIndex];
  const qLen = shuffledQuestions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="quiz-page">

      {/* TAB-SWITCH WARNING BANNER */}
      {tabWarning && (
        <div className="quiz-tab-warning">
          ⚠️ Switching tabs during a quiz is not allowed. The timer kept running.
          <button className="quiz-tab-warning-close" onClick={() => setTabWarning(false)}>
            ✕
          </button>
        </div>
      )}

      {/* TOP BAR */}
      <div className="quiz-top-bar">
        <button className="quiz-back-btn" onClick={() => setShowExitModal(true)}>
          ← Back
        </button>
        <span className="quiz-title">{quizData.title}</span>
        <span className="quiz-progress-text">{answeredCount}/{qLen} answered</span>
      </div>

      {/* BODY */}
      <div className="quiz-body">

        {/* LEFT — question panel */}
        <div className="quiz-q-panel">

          {error && <div className="quiz-error-box">{error}</div>}

          <h2 className="quiz-q-heading">Question {currentIndex + 1}.</h2>
          <p className="quiz-q-text">{q.text}</p>

          <div className="quiz-options">
            {q.choices.map((choice, ci) => (
              <label
                key={choice.id}
                className={`quiz-opt-row ${answers[q.id] === choice.id ? "selected" : ""}`}
              >
                <span className="quiz-opt-letter">{OPTION_LABELS[ci]}</span>
                <input
                  type="radio"
                  name={`question-${q.id}`}
                  checked={answers[q.id] === choice.id}
                  onChange={() => handleAnswerChange(q.id, choice.id)}
                />
                {choice.text}
              </label>
            ))}
          </div>

          <div className="quiz-action-bar">
            <button className="quiz-btn-clear" onClick={handleClearResponse}>
              Clear Response
            </button>
            <div className="quiz-nav-btns">
              <button
                className="quiz-btn-prev"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                ◄ Previous
              </button>
              <button
                className="quiz-btn-next"
                onClick={handleNext}
                disabled={currentIndex === qLen - 1}
              >
                Next ►
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — sidebar */}
        <div className="quiz-sidebar">

          <div className={`quiz-timer ${isLowTime ? "quiz-timer--warning" : ""}`}>
            <div className="quiz-timer-label">Time Remaining</div>
            <div className="quiz-timer-value">
              {timeLeft !== null ? fmtTime(timeLeft) : "--:--:--"}
            </div>
            {isLowTime && (
              <div className="quiz-timer-warning">⚠ Less than 1 minute!</div>
            )}
          </div>

          <div className="quiz-palette-legend">
            <span className="pal-legend-item">
              <span className="pal-dot answered" />Answered
            </span>
            <span className="pal-legend-item">
              <span className="pal-dot not-answered" />Not answered
            </span>
            <span className="pal-legend-item">
              <span className="pal-dot not-visited" />Not visited
            </span>
          </div>

          <div className="quiz-palette-grid">
            {shuffledQuestions.map((pq, idx) => (
              <button
                key={pq.id}
                className={`quiz-pal-btn ${palClass(palette[pq.id])} ${idx === currentIndex ? "active" : ""}`}
                onClick={() => goTo(idx)}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button
            className="quiz-submit-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit Quiz"}
          </button>
        </div>
      </div>

      {/* EXIT MODAL */}
      {showExitModal && (
        <div className="quiz-modal-overlay">
          <div className="quiz-modal-box">
            <h3>Exit Quiz?</h3>
            <p>
              ⚠️ Your progress will be lost if you exit now.
              <br /><br />
              The timer keeps running — you can re-attempt after submitting.
            </p>
            <div className="quiz-modal-actions">
              <button className="quiz-btn-cancel" onClick={() => setShowExitModal(false)}>
                Stay
              </button>
              <button className="quiz-btn-exit" onClick={handleExitQuiz}>
                Exit Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
