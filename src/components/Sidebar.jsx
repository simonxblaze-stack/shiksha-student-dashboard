import { NavLink, useLocation } from "react-router-dom";
import "../styles/sidebar.css";
import logo from "../assets/Vector.svg";

// icons
import { MdDashboardCustomize } from "react-icons/md";
import { BsBook } from "react-icons/bs";
import { BiVideo } from "react-icons/bi";
import { FaClipboardList, FaBookOpen } from "react-icons/fa";
import { RiLiveLine } from "react-icons/ri";
import { AiOutlineFileDone } from "react-icons/ai";

export default function Sidebar() {
  const location = useLocation();

  // detect if inside a specific subject
  const subjectMatch = location.pathname.match(
    /^\/subjects\/([^/]+)/
  );

  const subjectId = subjectMatch ? subjectMatch[1] : null;

  const isSubjectsActive = location.pathname.startsWith("/subjects");

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar__brand">
        <img src={logo} alt="Logo" className="sidebar__logoCircle" />
        <div>
          <h2 className="sidebar__title">ShikshaCom</h2>
          <p className="sidebar__tagline">Empowerment Through Education</p>
        </div>
      </div>

      <nav className="sidebar__nav">
        <NavLink className="sidebar__link" to="/" end>
          <span className="sidebar__icon">
            <MdDashboardCustomize />
          </span>
          Dashboard
        </NavLink>

        <NavLink className="sidebar__link" to="/subjects">
          <span className="sidebar__icon">
            <BsBook />
          </span>
          Subject
        </NavLink>

        {isSubjectsActive && subjectId && (
          <div className="sidebar__subMenu">
            <NavLink
              className="sidebar__subLink"
              to={`/subjects/${subjectId}/assignments`}
            >
              <FaClipboardList /> <span>Assignment</span>
            </NavLink>

            <NavLink
              className="sidebar__subLink"
              to={`/subjects/${subjectId}/quiz`}
            >
              <AiOutlineFileDone /> <span>Quiz</span>
            </NavLink>

            <NavLink
              className="sidebar__subLink"
              to={`/subjects/${subjectId}/recordings`}
            >
              <BiVideo /> <span>Recordings</span>
            </NavLink>

            <NavLink
              className="sidebar__subLink"
              to={`/subjects/${subjectId}/study-material`}
            >
              <FaBookOpen /> <span>Study Material</span>
            </NavLink>
          </div>
        )}

        <NavLink className="sidebar__link" to="/live-sessions">
          <span className="sidebar__icon">
            <RiLiveLine />
          </span>
          Live Sessions
        </NavLink>
      </nav>
    </aside>
  );
}