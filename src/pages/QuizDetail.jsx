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

function makeSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getShuffledQuestions(questions, quizId, attemptKey) {
  const storageKey = `quiz_${quizId}_${attemptKey}_order`;
  let orderMap = null;

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) orderMap = JSON.parse(stored);
  } catch {}

  if (!orderMap) {
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
  const [quizReady, setQuizReady]        = useState(false);

  const answersRef    = useRef({});
  const submittedRef  = useRef(false);
  const mountedRef    = useRef(true);
  const durationRef   = useRef(null);
  const startTimeRef  = useRef(null);
  const attemptKeyRef = useRef("1");

  // ── fetch + start ──────────────────────────────────────────────────────────
  useEffect(() => {
    // FIX 3: guard both quizId and subjectId
    if (!quizId || !subjectId) return;

    async function handleAutoSubmitImmediate(answerEntries) {
      try {
        const formatted = answerEntries.map(([q, c]) => ({ question: q, selected_choice: c }));
        await api.post(`/student/quizzes/${quizId}/submit/`, { answers: formatted });
        navigate(`/subjects/quiz/${subjectId}/result/${quizId}`);
      } catch (err) {
        setError("Time is up — your quiz was submitted. " + (err.response?.data?.detail || ""));
        setLoading(false);
      }
    }

    async function initQuiz() {
      try {
        setLoading(true);
        setError(null);

        let attemptNumber = "1";
        try {
          // FIX 1: use /student/quizzes/ to match submit endpoint
          const startRes = await api.post(`/student/quizzes/${quizId}/start/`);
          if (startRes.data?.attempt_id) {
            attemptNumber = String(startRes.data.attempt_id).slice(-8);
          }
        } catch (err) {
          const msg = err.response?.data?.detail;
          if (msg) { setError(msg); setLoading(false); return; }
        }
        attemptKeyRef.current = attemptNumber;

        // FIX 2: use /student/quizzes/ so only enrolled-subject quizzes load
        const res = await api.get(`/student/quizzes/${quizId}/`);
        setQuizData(res.data);

        const shuffled = getShuffledQuestions(
          res.data.questions,
          quizId,
          attemptNumber
        );
        setShuffled(shuffled);

        const init = {};
        shuffled.forEach((q, i) => {
          init[q.id] = i === 0 ? S.NOT_ANSWERED : S.NOT_VISITED;
        });
        setPalette(init);

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
        const remaining = durationRef.current - elapsed;

        if (remaining <= 0) {
          setTimeLeft(0);
          setLoading(false);
          submittedRef.current = true;
          localStorage.removeItem(`quiz_${quizId}_start`);
          await handleAutoSubmitImmediate(Object.entries(answersRef.current));
          return;
        }

        setTimeLeft(remaining);
        setQuizReady(true);
      } catch (err) {
        setError(err.response?.data?.detail || "Unable to load quiz.");
      } finally {
        setLoading(false);
      }
    }

    initQuiz();
  // FIX 3: added subjectId to dependency array
  }, [quizId, subjectId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Block in-app navigation while quiz is active ─────────────────────────
  const [showNavWarning, setShowNavWarning] = useState(false);
  const pendingNavRef = useRef(null);

  useEffect(() => {
    if (!quizReady) return;

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      if (!submittedRef.current) {
        window.history.pushState(null, "", window.location.href);
        setShowNavWarning(true);
      }
    };

    const handleBeforeUnload = (e) => {
      if (!submittedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [quizReady]);

  useEffect(() => {
    if (!quizReady) return;

    const originalPushState = window.history.pushState.bind(window.history);

    window.history.pushState = function(state, title, url) {
      if (url && url.toString() === window.location.href) {
        return originalPushState(state, title, url);
      }
      if (!submittedRef.current) {
        pendingNavRef.current = () => {
          window.history.pushState = originalPushState;
          originalPushState(state, title, url);
          window.dispatchEvent(new PopStateEvent("popstate", { state }));
        };
        setShowNavWarning(true);
        return;
      }
      return originalPushState(state, title, url);
    };

    return () => {
      window.history.pushState = originalPushState;
    };
  }, [quizReady]);

  // ── Auto-submit ────────────────────────────────────────────────────────────
  const handleAutoSubmit = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const formatted = Object.entries(answersRef.current).map(([q, c]) => ({
        question: q, selected_choice: c,
      }));
      await api.post(`/student/quizzes/${quizId}/submit/`, { answers: formatted });
      localStorage.removeItem(`quiz_${quizId}_start`);
      navigate(`/subjects/quiz/${subjectId}/result/${quizId}`);
    } catch (err) {
      setTimeout(async () => {
        if (!mountedRef.current) return;
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
    submittedRef.current = true;
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
      const msg = err.response?.data?.detail
        || (err.response?.data && typeof err.response.data === 'object'
            ? Object.values(err.response.data).flat().join(' ')
            : null)
        || "Failed to submit quiz. Please check your connection and try again.";
      setError(msg);
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

      {/* NAVIGATION WARNING MODAL */}
      {showNavWarning && (
        <div className="quiz-modal-overlay">
          <div className="quiz-modal-box">
            <h3>Leave Quiz?</h3>
            <p>
              You have an active quiz in progress.
              <br /><br />
              ⚠️ The timer will keep running if you leave.
              <br />
              You can come back and resume — your answers are saved.
            </p>
            <div className="quiz-modal-actions">
              <button
                className="quiz-btn-cancel"
                onClick={() => {
                  pendingNavRef.current = null;
                  setShowNavWarning(false);
                }}
              >
                Stay in Quiz
              </button>
              <button
                className="quiz-btn-exit"
                onClick={() => {
                  setShowNavWarning(false);
                  if (pendingNavRef.current) {
                    pendingNavRef.current();
                    pendingNavRef.current = null;
                  }
                }}
              >
                Leave Anyway
              </button>
            </div>
          </div>
        </div>
      )}

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
