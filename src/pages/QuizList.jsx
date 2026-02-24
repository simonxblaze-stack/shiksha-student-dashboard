import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QuizCard from "../components/QuizCard";
import "../styles/quiz.css";

export default function QuizList() {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const [activeTab, setActiveTab] = useState("pending");

  // State for data (future backend data)
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);

  // Mock data (simulates backend response)
 useEffect(() => {
  const fetchQuizzes = async () => {
    try {
      const res = await fetch(
        `/api/student/quizzes/?subject=${subjectId}&status=${activeTab}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to fetch quizzes");

      const data = await res.json();

      if (activeTab === "pending") {
        setPendingQuizzes(data);
      } else {
        setCompletedQuizzes(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  fetchQuizzes();
}, [subjectId, activeTab]);

{/*   // example for backend //

  useEffect(() => {
  fetch(`/api/subjects/${subjectId}/quizzes`)
    .then((res) => res.json())
    .then((data) => {
      setPendingQuizzes(data.pending);
      setCompletedQuizzes(data.completed);
    });
}, [subjectId]);

*/}

  const quizzes = activeTab === "pending" ? pendingQuizzes : completedQuizzes;

  const handleQuizClick = (quiz) => {
    if (activeTab === "pending") {
      navigate(`/subjects/quiz/${subjectId}/take/${quiz.id}`);
    } else {
      navigate(`/subjects/quiz/${subjectId}/result/${quiz.id}`);
    }
  };


  return (
    <div className="quizListPage">
      {/* Back button in grey header area (like screenshot) */}
      <button className="quizBackHeader" onClick={() => navigate(-1)}>
        &lt; Back
      </button>

      <div className="quizListBox">
        {/* Title center */}
        <h2 className="quizListTitle">Subject Name</h2>

        {/* Tabs + Search Row */}
        <div className="quizTopRow">
          <div className="quizTabs">
            <button
              className={`quizTab ${activeTab === "pending" ? "quizTabActive" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              Pending
            </button>

            <button
              className={`quizTab ${activeTab === "completed" ? "quizTabActive" : ""}`}
              onClick={() => setActiveTab("completed")}
            >
              Completed
            </button>
          </div>

          <div className="quizSearch">
            <input placeholder="Search..." />
            <span className="quizSearchIcon">🔍</span>
          </div>
        </div>

        {/* Grid */}
        <div className="quizGrid">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} {...quiz} onClick={() => handleQuizClick(quiz)} />
          ))}
        </div>
      </div>
    </div>
  );
}
