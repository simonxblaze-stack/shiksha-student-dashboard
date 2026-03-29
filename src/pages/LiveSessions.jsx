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
  const [subjects, setSubjects] = useState([]); // ✅ NEW
  const [selectedSubject, setSelectedSubject] = useState(""); // ✅ NEW
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeCourse) {
      setSessions([]);
      setSubjects([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // ✅ fetch sessions
        const sessionRes = await api.get(
          `/livestream/student/sessions/?course_id=${activeCourse.id}`
        );

        // ✅ fetch subjects
        const subjectRes = await api.get(
          `/courses/${activeCourse.id}/subjects/`
        );

        const sorted = sessionRes.data.sort(
          (a, b) => new Date(a.start_time) - new Date(b.start_time)
        );

        setSessions(sorted);
        setSubjects(subjectRes.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load sessions.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeCourse]);

  // ✅ FILTER LOGIC
  const filteredSessions = selectedSubject
  ? sessions.filter(
      (s) => String(s.subject?.id) === String(selectedSubject)
    )
  : sessions;

  // ✅ FORMATTERS
  const formatIST = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
  };

  const formatTimeIST = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
  };

  const formatStatus = (session) => {
    const status = session.computed_status;

    if (status === "LIVE") return "🔴 Live Now";
    if (status === "SCHEDULED")
      return `Starts at ${formatTimeIST(session.start_time)}`;
    if (status === "COMPLETED") return "Completed";
    return status;
  };

  if (loading) return <div style={{ padding: 20 }}>Loading sessions...</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>{error}</div>;

  console.log("SESSION SAMPLE:", sessions[0]);

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

        {/* ✅ FILTER DROPDOWN */}
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={{
            marginLeft: "20px",
            padding: "6px 10px",
            borderRadius: "6px",
          }}
        >
          <option value="">All Subjects</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      <div className="liveSessionsBodyBox">
        {!activeCourse ? (
          <div>Please select a course.</div>
        ) : filteredSessions.length === 0 ? (
          <div>No live sessions available.</div>
        ) : (
          <div className="liveGrid">
            {filteredSessions.map((s) => (
              <div
                key={s.id}
                className={`liveCard ${s.can_join ? "" : "disabledCard"}`}
                onClick={() => {
                  if (!s.can_join) return;
                  navigate(`/live/${s.id}`);
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
                    {formatIST(s.start_time)}
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