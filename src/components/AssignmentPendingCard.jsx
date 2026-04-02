import { useState } from "react";
import "./CompletedAssignment.css";

const CompletedAssignment = ({ assignment }) => {
  const {
    title = "",
    subject = "",
    chapter = "",
    teacher = "",
    className = "",
    description = "",
    assignedOn = "",
    dueDate = "",
    teacherFile = { name: "", size: "—", url: "#" },
    submittedOn = "",
    submissionStatus = "On time",
    submittedFile = { name: "Submitted File", size: "—", type: "", url: "#" },
  } = assignment || {};

  const [teacherFileCopied, setTeacherFileCopied] = useState(false);
  const [submittedFileCopied, setSubmittedFileCopied] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("details"); // "details" | "file"
  const [heroHovered, setHeroHovered] = useState(false);

  const fileType =
    submittedFile?.type ||
    (submittedFile?.name?.includes(".")
      ? submittedFile.name.split(".").pop().toUpperCase()
      : "");

  const handleCopy = (url, setter) => {
    navigator.clipboard.writeText(url).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    });
  };

  const DESC_LIMIT = 120;
  const isLongDesc = description.length > DESC_LIMIT;
  const displayedDesc =
    isLongDesc && !descExpanded
      ? description.slice(0, DESC_LIMIT) + "…"
      : description;

  return (
    <div className="ca-wrapper">

      {/* Top Bar */}
      <div className="ca-topbar">
        <div className="ca-status-pill">
          <div className="ca-status-dot" />
          <span>Completed</span>
        </div>
      </div>

      {/* Three Column Grid */}
      <div className="ca-grid">

        {/* Column 1 */}
        <div className="ca-col">
          {(subject || chapter) && (
            <div className="ca-subject-tag">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M5 3v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {subject}{chapter ? ` · ${chapter}` : ""}
            </div>
          )}
          <h2 className="ca-asn-title">{title}</h2>
          {(teacher || className) && (
            <p className="ca-chapter-line">
              {teacher && `Assigned by ${teacher}`}
              {teacher && className && <>&nbsp;·&nbsp;</>}
              {className}
            </p>
          )}
          <div className="ca-divider" />
          <p className="ca-col-label">Description</p>
          <p className="ca-desc-text">{displayedDesc}</p>
          {isLongDesc && (
            <button
              className="ca-read-more-btn"
              onClick={() => setDescExpanded(v => !v)}
            >
              {descExpanded ? "Show less ↑" : "Read more ↓"}
            </button>
          )}
        </div>

        {/* Column 2 */}
        <div className="ca-col">
          {/* Tab switcher */}
          <div className="ca-tabs">
            <button
              className={`ca-tab ${activeTab === "details" ? "active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              Assignment Details
            </button>
            <button
              className={`ca-tab ${activeTab === "file" ? "active" : ""}`}
              onClick={() => setActiveTab("file")}
            >
              Teacher's File
            </button>
          </div>

          {activeTab === "details" && (
            <div className="ca-meta-grid">
              <div className="ca-meta-box ca-meta-hover">
                <div className="ca-meta-lbl">Assigned on</div>
                <div className="ca-meta-val">{assignedOn}</div>
              </div>
              <div className="ca-meta-box ca-meta-hover">
                <div className="ca-meta-lbl">Due date</div>
                <div className="ca-meta-val">{dueDate}</div>
              </div>
              {subject && (
                <div className="ca-meta-box ca-meta-hover">
                  <div className="ca-meta-lbl">Subject</div>
                  <div className="ca-meta-val">{subject}</div>
                </div>
              )}
              {teacher && (
                <div className="ca-meta-box ca-meta-hover">
                  <div className="ca-meta-lbl">Teacher</div>
                  <div className="ca-meta-val">{teacher}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === "file" && teacherFile?.url && (
            <div className="ca-file-tab-content">
              <div className="ca-file-row">
                <div className="ca-file-icon-box">
                  <svg viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="1" width="10" height="13" rx="1.5" stroke="#ef4444" strokeWidth="1.2"/>
                    <path d="M5 5h6M5 8h6M5 11h3" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="ca-file-meta">
                  <div className="ca-file-name">{teacherFile.name || "Attachment"}</div>
                  <div className="ca-file-size">{teacherFile.size}</div>
                </div>
                <button className="ca-view-link" onClick={() => window.open(teacherFile.url, "_blank")}>
                  View
                </button>
              </div>
              <button
                className="ca-copy-link-btn"
                onClick={() => handleCopy(teacherFile.url, setTeacherFileCopied)}
              >
                {teacherFileCopied ? "✓ Link copied!" : "Copy link"}
              </button>
            </div>
          )}
        </div>

        {/* Column 3 */}
        <div className="ca-col">
          <p className="ca-col-label" style={{ marginBottom: "12px" }}>Your submission</p>

          <div
            className={`ca-submitted-hero ${heroHovered ? "hovered" : ""}`}
            onMouseEnter={() => setHeroHovered(true)}
            onMouseLeave={() => setHeroHovered(false)}
          >
            <div className="ca-check-ring">
              <svg viewBox="0 0 22 22" fill="none">
                <polyline points="4,11 9,16 18,6" stroke="#1abc9c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="ca-hero-label">Successfully submitted</p>
            <p className="ca-hero-sub">Your work has been sent to your teacher</p>
          </div>

          <div className="ca-submission-meta">
            {submittedOn && (
              <div className="ca-sm-row ca-sm-hover">
                <span className="ca-sm-key">Submitted on</span>
                <span className="ca-sm-val">{submittedOn}</span>
              </div>
            )}
            <div className="ca-sm-row ca-sm-hover">
              <span className="ca-sm-key">Submission status</span>
              <span className={`ca-sm-val ${submissionStatus === "On time" ? "green" : "amber"}`}>
                {submissionStatus}
              </span>
            </div>
            {fileType && (
              <div className="ca-sm-row ca-sm-hover">
                <span className="ca-sm-key">File type</span>
                <span className="ca-sm-val">{fileType}</span>
              </div>
            )}
            {submittedFile?.size && submittedFile.size !== "—" && (
              <div className="ca-sm-row ca-sm-hover">
                <span className="ca-sm-key">File size</span>
                <span className="ca-sm-val">{submittedFile.size}</span>
              </div>
            )}
          </div>

          <div className="ca-action-row">
            {submittedFile?.url && (
              <button
                className="ca-view-file-btn"
                onClick={() => window.open(submittedFile.url, "_blank")}
              >
                <svg viewBox="0 0 15 15" fill="none">
                  <path d="M1 7.5C1 7.5 3.5 3 7.5 3C11.5 3 14 7.5 14 7.5C14 7.5 11.5 12 7.5 12C3.5 12 1 7.5 1 7.5Z" stroke="currentColor" strokeWidth="1.3"/>
                  <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                View Submitted File
              </button>
            )}
            {submittedFile?.url && (
              <button
                className="ca-copy-submitted-btn"
                onClick={() => handleCopy(submittedFile.url, setSubmittedFileCopied)}
                title="Copy file link"
              >
                {submittedFileCopied ? "✓" : (
                  <svg viewBox="0 0 15 15" fill="none" width="14" height="14">
                    <rect x="4" y="4" width="8" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M3 10H2.5A1.5 1.5 0 0 1 1 8.5v-6A1.5 1.5 0 0 1 2.5 1h6A1.5 1.5 0 0 1 10 2.5V3" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CompletedAssignment;