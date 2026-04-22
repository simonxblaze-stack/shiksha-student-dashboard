// ============================================================
// STUDENT — src/components/AssignmentCard.jsx  (FULL REPLACEMENT)
// ============================================================

import { useNavigate } from "react-router-dom";
import "../styles/listCard.css";

function getUrgency(dueDateStr) {
  if (!dueDateStr) return { label: "", intensity: 0 };
  const now      = new Date();
  const due      = new Date(dueDateStr);
  const diffMs   = due - now;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffMs < 0)      return { label: "Overdue",  intensity: 1.0  };
  if (diffDays <= 1)   return { label: "Due today", intensity: 0.85 };
  if (diffDays <= 3)   return { label: "Due soon",  intensity: 0.55 };
  if (diffDays <= 7)   return { label: "This week", intensity: 0.30 };
  if (diffDays <= 14)  return { label: "2 weeks",   intensity: 0.15 };
  return { label: "", intensity: 0 };
}

function formatDueDate(dueDateStr) {
  if (!dueDateStr) return "No due date";
  // Already a nicely formatted string (not ISO) — return as-is
  if (!dueDateStr.includes("T") && !dueDateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dueDateStr;
  }
  return new Date(dueDateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function AssignmentCard({
  id,
  subjectId,
  title,
  teacher,
  due,
  urgency = "green",
}) {
  const navigate = useNavigate();
  const { label, intensity } = getUrgency(due);

  const handleClick = () => {
    navigate(`/subjects/${subjectId}/assignments/${id}`);
  };

  const formattedDue = formatDueDate(due);

  // Day badge from formatted string e.g. "(Friday)"
  const dayMatch = formattedDue?.match(/\(([^)]+)\)/);
  const dayBadge = dayMatch ? dayMatch[1] : "";

  // Badge colour scales from yellow → orange → red with urgency
  const badgeColor = intensity >= 0.85
    ? { color: "#ef4444", bg: "rgba(239,68,68,0.12)" }
    : intensity >= 0.5
    ? { color: "#f97316", bg: "rgba(249,115,22,0.12)" }
    : { color: "#ca8a04", bg: "rgba(202,138,36,0.12)" };

  return (
    <div
      className={`listItem listItem--${urgency}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Red gradient overlay — fades in from right based on urgency */}
      {intensity > 0 && (
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          background: `linear-gradient(to right, transparent 45%, rgba(239,68,68,${intensity * 0.18}) 100%)`,
          pointerEvents: "none",
        }} />
      )}

      {/* Urgency badge */}
      {label && (
        <span style={{
          position: "absolute",
          top: 8,
          right: 8,
          fontSize: "9px",
          fontWeight: 700,
          color: badgeColor.color,
          background: badgeColor.bg,
          padding: "2px 7px",
          borderRadius: "20px",
          whiteSpace: "nowrap",
          zIndex: 1,
        }}>
          {label}
        </span>
      )}

      {dayBadge && <span className="listItem__badge">{dayBadge}</span>}

      <div className="listItem__left">
        <p className="listItem__title">{title}</p>
        <p className="listItem__sub">Teacher: {teacher}</p>
        <p className="listItem__sub">Due: {formattedDue}</p>
      </div>
    </div>
  );
}
