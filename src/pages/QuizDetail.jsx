import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/quiz.css";

export default function QuizDetail() {
  const navigate = useNavigate();
  const { quizId } = useParams();

  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ===============================
  // FETCH QUIZ FROM BACKEND
  // ===============================
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);

        const res = await fetch(`/api/quizzes/${quizId}/`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to load quiz.");
        }

        const data = await res.json();
        setQuizData(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load quiz.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  // ===============================
  // HANDLE ANSWER CHANGE
  // ===============================
  const handleAnswerChange = (question_id, choice_id) => {
    setAnswers((prev) => ({
      ...prev,
      [question_id]: choice_id,
    }));
  };

  // ===============================
  // SUBMIT QUIZ
  // ===============================
  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const formattedAnswers = Object.entries(answers).map(
        ([question_id, choice_id]) => ({
          question: question_id,
          selected_choice: choice_id,
        })
      );

      const res = await fetch(`/api/quizzes/${quizId}/submit/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          answers: formattedAnswers,
        }),
      });

      if (!res.ok) {
        throw new Error("Submission failed.");
      }

      const resultData = await res.json();

      navigate(`/subjects/quiz/result/${quizId}`, {
        state: resultData,
      });
    } catch (err) {
      console.error(err);
      setError("Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  // ===============================
  // STATES
  // ===============================

  if (loading) {
    return <div className="quizDetailPage">Loading quiz...</div>;
  }

  if (error) {
    return <div className="quizDetailPage">{error}</div>;
  }

  if (!quizData) {
    return null;
  }

  const allAnswered = quizData.questions.every(
    (q) => answers[q.id] !== undefined
  );

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="quizDetailPage">
      <div className="quizDetailBox">
        {/* Back Button */}
        <button className="quizDetailBack" onClick={() => navigate(-1)}>
          &lt; Back
        </button>

        {/* Header */}
        <div className="quizDetailHeader">
          <h2 className="quizDetailTitle">
            {quizData.subject_name || "Subject"}
          </h2>
          <div className="quizDetailSearch">
            <input placeholder="Search..." />
            <span className="quizDetailSearchIcon">🔍</span>
          </div>
        </div>

        {/* Quiz Content */}
        <div className="quizDetailContent">
          {/* Quiz Info */}
          <div className="quizDetailInfo">
            <h3 className="quizDetailInfoTitle">
              {quizData.title}
            </h3>
            <p className="quizDetailInfoMeta">
              {quizData.teacher_name} -{" "}
              {new Date(quizData.created_at).toLocaleDateString()}
            </p>
            <p className="quizDetailInfoDue">
              Due Date:{" "}
              {new Date(quizData.due_date).toLocaleString()}
            </p>
          </div>

          {/* Questions */}
          <div className="quizDetailQuestions">
            {quizData.questions.map((q, index) => (
              <div key={q.id} className="quizDetailQuestion">
                <p className="quizDetailQuestionText">
                  {index + 1}. {q.text}
                </p>

                <div className="quizDetailOptions">
                  {q.choices.map((choice) => (
                    <label
                      key={choice.id}
                      className="quizDetailOption"
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        checked={answers[q.id] === choice.id}
                        onChange={() =>
                          handleAnswerChange(q.id, choice.id)
                        }
                      />
                      <span className="quizDetailOptionRadio"></span>
                      <span className="quizDetailOptionText">
                        {choice.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="quizDetailSubmitWrap">
            <button
              className="quizDetailSubmit"
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}