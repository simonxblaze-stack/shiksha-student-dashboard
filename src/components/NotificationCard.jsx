import { useNavigate } from "react-router-dom";
import "../styles/listCard.css";

const TYPE_LABELS = {
  ASSIGNMENT: "Assignment",
  SESSION: "Live Session",
  QUIZ: "Quiz",
  SUBMISSION: "Submission",
};

const TYPE_CLASSES = {
  ASSIGNMENT: "assignments",
  SESSION: "livesessions",
  QUIZ: "quiz",
  SUBMISSION: "submission",
};

export default function NotificationCard({ notification, onRead }) {
  const navigate = useNavigate();
  const item = notification || {};
  const { id, type, title, subject_name, subject_id, is_read } = item;
  const typeClass = TYPE_CLASSES[type] || "";
  const displayLabel = TYPE_LABELS[type] || type;

  const handleClick = () => {
    if (!is_read && id && onRead) onRead(id);
    if (subject_id) {
      if (type === "ASSIGNMENT") { navigate("/subjects/" + subject_id + "/assignments"); return; }
      if (type === "QUIZ") { navigate("/subjects/quiz/" + subject_id); return; }
      if (type === "SESSION") { navigate("/live-sessions"); return; }
      navigate("/subjects/" + subject_id);
    } else {
      if (type === "ASSIGNMENT") navigate("/assignments");
      else if (type === "QUIZ") navigate("/subjects/quiz");
      else if (type === "SESSION") navigate("/live-sessions");
    }
  };

  return (
    <div className={"notifItem notifItem--" + typeClass + (!is_read ? " notifItem--unread" : "")} onClick={handleClick} role="button" tabIndex={0} style={{cursor:"pointer"}}>
      <div className="notifItem__bar" />
      {!is_read && <span className="notifItem__unreadDot" />}
      <div className="notifItem__content">
        <div className="notifItem__header">
          <span className={"notifItem__badge notifItem__badge--" + typeClass}>{displayLabel}</span>
        </div>
        <p className="notifItem__title">{title}</p>
        {subject_name && <p className="notifItem__sub">{subject_name}</p>}
      </div>
    </div>
  );
}
