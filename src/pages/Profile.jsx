import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getPublicProfile } from "../utils/profileStorage";
import "../styles/profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const stored = getPublicProfile();
  const p = user?.profile || {};

  const studentInfo = {
    name: stored.name || p.full_name || "",
    className: p.class_name || "",
    board: p.board || "",
    studentId: p.student_id || "",
  };

  const avatar = p.avatar || null;
  const avatarType = p.avatar_type || null;
  const about = stored.about ?? "";
  const subjects = stored.subjects ?? [];
  const hobbies = stored.hobbies ?? [];
  const languages = stored.languages ?? [];

  if (loading) return <div className="profileLoading">Loading...</div>;

  return (
    <div className="profilePage">
      <div className="profileContainer">

        {/* ── Header ── */}
        <div className="profileHeader">
          <div className="profileHeader__left">

            {/* Avatar */}
            <div className="profileHeader__avatarWrap">
              <div className="profileHeader__avatar">
                {avatar ? (
                  avatarType === "emoji"
                    ? <span className="profileHeader__avatarEmoji">{avatar}</span>
                    : <img src={avatar} alt={studentInfo?.name} />
                ) : (
                  <span className="profileHeader__avatarFallback">
                    {studentInfo?.name?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
            </div>

            {/* Name & meta */}
            <div className="profileHeader__info">
              <h2 className="profileHeader__name">{studentInfo.name}</h2>
              <div className="profileHeader__badges">
                {studentInfo.className && (
                  <span className="profileBadge profileBadge--class">
                    {studentInfo.className}
                  </span>
                )}
                {studentInfo.board && (
                  <span className="profileBadge profileBadge--board">
                    {studentInfo.board}
                  </span>
                )}
                {studentInfo.studentId && (
                  <span className="profileBadge profileBadge--id">
                    ID: {studentInfo.studentId}
                  </span>
                )}
                <span className="profileBadge profileBadge--online">
                  <span className="profileBadge__dot" />
                  Online
                </span>
                {languages.length > 0 && (
                  <span className="profileBadge profileBadge--lang">
                    {languages.join(" & ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="profileHeader__actions">
            <button
              className="profileBtn profileBtn--outline"
              onClick={() => navigate("/profile/edit")}
            >
              Edit Profile
            </button>
            <button
              className="profileBtn profileBtn--outline profileBtn--private"
              onClick={() => navigate("/profile/private-details")}
            >
              Private Details
            </button>
          </div>
        </div>

        <hr className="profileDivider" />

        {/* ── About ── */}
        <div className="profileSection">
          <h3 className="profileSection__title">About</h3>
          {about
            ? <p className="profileSection__text">{about}</p>
            : <p className="profileSection__placeholder">Add a short bio to introduce yourself</p>
          }
        </div>

        <hr className="profileDivider" />

        {/* ── Interests ── */}
        <div className="profileSection">
          <h3 className="profileSection__title">Interests</h3>
          <div className="interests__grid">
            <div className="interests__col">
              <h4 className="interests__colTitle">Subjects</h4>
              {subjects.length > 0
                ? subjects.map((s, i) => (
                    <div key={i} className="interests__item"><span>• {s}</span></div>
                  ))
                : <p className="profileSection__placeholder">No interest added yet</p>
              }
            </div>
            <div className="interests__col">
              <h4 className="interests__colTitle">Hobbies</h4>
              {hobbies.length > 0
                ? hobbies.map((h, i) => (
                    <div key={i} className="interests__item"><span>• {h}</span></div>
                  ))
                : <p className="profileSection__placeholder">No hobbies added yet</p>
              }
            </div>
          </div>
        </div>

        <hr className="profileDivider" />

        {/* ── Private Session Activity ── */}
        <div className="profileSection">
          <h3 className="profileSection__title">Private Session Activity</h3>
          <p className="profileSection__placeholder">No Private Sessions Attended yet</p>
        </div>

        <hr className="profileDivider" />
      </div>

    </div>
  );
}
