import { useNavigate } from "react-router-dom";
import "../styles/assignmentPending.css";

export default function AssignmentPendingCard({ 
  id, 
  subjectId,
  title, 
  teacher, 
  chapter,
  deadline 
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/subjects/${subjectId}/assignments/${id}`);
  };

  return (
    <div className="assignmentPendingCard" onClick={handleClick}>
      <div className="assignmentPendingCard__top">
        <p className="assignmentPendingCard__title">{title}</p>
      </div>

      {/* ✅ NEW */}
      {chapter && (
        <p className="assignmentPendingCard__chapter">
          {chapter}
        </p>
      )}

      {/* ✅ UPDATED */}
      {teacher && (
        <p className="assignmentPendingCard__teacher">
          {teacher}
        </p>
      )}

      <div className="assignmentPendingCard__bottom">
        {/* ✅ FIXED */}
        <p className="assignmentPendingCard__deadline">
          Due: {deadline}
        </p>
      </div>
    </div>
  );
}