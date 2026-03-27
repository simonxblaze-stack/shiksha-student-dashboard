import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCourse } from "../contexts/CourseContext";
import api from "../api/apiClient";
import PageHeader from "../components/PageHeader";
import "../styles/liveSessions.css";

export default function LiveSessions() {
  const navigate = useNavigate();
  const { activeCourse } = useCourse();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeCourse) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const fetchSessions = async () => {
      setLoading(true);
      try {
        const res = await api.get(
          `https://api.shikshacom.com/api/livestream/student/sessions/?course_id=${activeCourse.id}`
        );

        const sorted = res.data.sort(
          (a, b) => new Date(a.start_time) - new Date(b.start_time)
        );

        setSessions(sorted);
      } catch (err) {
        console.error(err);
        setError("Unable to load sessions.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [activeCourse]);

  const formatStatus = (session) => {
    const status = session.computed_status;

    if (status === "LIVE") return "🔴 Live Now";
    if (status === "SCHEDULED")
      return `Starts at ${new Date(session.start_time).toLocaleTimeString()}`;
    if (status === "COMPLETED") return "Completed";
    return status;
  };

  if (loading) return <div style={{ padding: 20 }}>Loading sessions...</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>{error}</div>;

  return (
    <div className="liveSessionsPage">
      <div className="liveSessionsHeaderBox">
        <PageHeader
          title={
            activeCourse
              ? `Live Sessions - ${activeCourse.title}`
              : "Live Sessions"
          }
        />
      </div>

      <div className="liveSessionsBodyBox">
        {!activeCourse ? (
          <div>Please select a course.</div>
        ) : sessions.length === 0 ? (
          <div>No live sessions available.</div>
        ) : (
          <div className="liveGrid">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`liveCard ${s.can_join ? "" : "disabledCard"}`}
                onClick={() => {
                  if (s.can_join) navigate(`/live/${s.id}`);
                }}
                style={{
                  cursor: s.can_join ? "pointer" : "not-allowed",
                  opacity: s.can_join ? 1 : 0.6,
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600"
                  alt={s.title}
                  className="liveCardImg"
                />
                <div className="liveCardBody">
                  <p className="liveCardText">{s.title}</p>
                  <p className="liveCardText">{s.teacher}</p>
                  <p className="liveCardText">
                    {new Date(s.start_time).toLocaleString()}
                  </p>
                  <p className="liveCardText">{formatStatus(s)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}