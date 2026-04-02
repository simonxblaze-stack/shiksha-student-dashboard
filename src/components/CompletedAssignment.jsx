import { useState, useEffect } from "react";
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

  const [isVisible, setIsVisible] = useState(false);
  const [copiedTeacher, setCopiedTeacher] = useState(false);
  const [copiedStudent, setCopiedStudent] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const fileType =
    submittedFile?.type ||
    (submittedFile?.name?.includes(".")
      ? submittedFile.name.split(".").pop().toUpperCase()
      : "");

  const handleCopyTeacherFile = async () => {
    if (teacherFile?.url) {
      await navigator.clipboard.writeText(teacherFile.url);
      setCopiedTeacher(true);
      setTimeout(() => setCopiedTeacher(false), 2000);
    }
  };

  const handleCopyStudentFile = async () => {
    if (submittedFile?.url) {
      await navigator.clipboard.writeText(submittedFile.url);
      setCopiedStudent(true);
      setTimeout(() => setCopiedStudent(false), 2000);
    }
  };

  const MAX_DESC_LENGTH = 150;
  const needsExpansion = description.length > MAX_DESC_LENGTH;
  const displayDescription =
    expandedDescription || !needsExpansion
      ? description
      : description.slice(0, MAX_DESC_LENGTH) + "...";

  return (
    <div className={`ca-wrapper ${isVisible ? "ca-visible" : ""}`}>

      {/* Top Bar */}
      <div className="ca-topbar">
        <div className="ca-status-pill">
          <div className="ca-status-dot" />
          <span>Completed</span>
        </div>
        {(subject || chapter) && (
          <span className="ca-topbar-title">
            {subject}{chapter ? ` · ${chapter}` : ""}
          </span>
        )}
      </div>

      {/* Three Column Grid */}
      <div className="ca-grid">

        {/* Column 1 */}
        <div className="ca-col" style={{ animationDelay: "0.1s" }}>
          {(subject || chapter) && (
            <div className="ca-subject-tag">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 3v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {subject}{chapter ? ` · ${chapter}` : ""}
            </div>
          )}

          <h2 className="ca-asn-title">{title}</h2>

          {(teacher || className) && (
            <p className="ca-assigned-by">
              {teacher && `Assigned by ${teacher}`}
              {teacher && className && <>&nbsp;·&nbsp;</>}
              {className}
            </p>
          )}

          <div className="ca-divider" />

          <p className="ca-col-label">Description</p>
          <p className="ca-desc-text">{displayDescription}</p>

          {needsExpansion && (
            <button
              className="ca-read-more-btn"
              onClick={() => setExpandedDescription(!expandedDescription)}
            >
              {expandedDescription ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Column 2 */}
        <div className="ca-col" style={{ animationDelay: "0.2s" }}>
          <p className="ca-col-label" style={{ marginBottom: "10px" }}>Assignment details</p>

          <div className="ca-meta-grid">
            <div className="ca-meta-box">
              <div className="ca-meta-lbl">Assigned on</div>
              <div className="ca-meta-val">{assignedOn}</div>
            </div>
            <div className="ca-meta-box">
              <div className="ca-meta-lbl">Due date</div>
              <div className="ca-meta-val">{dueDate}</div>
            </div>
            {subject && (
              <div className="ca-meta-box">
                <div className="ca-meta-lbl">Subject</div>
                <div className="ca-meta-val">{subject}</div>
              </div>
            )}
            {teacher && (
              <div className="ca-meta-box">
                <div className="ca-meta-lbl">Teacher</div>
                <div className="ca-meta-val">{teacher}</div>
              </div>
            )}
          </div>

          {teacherFile?.url && (
            <>
              <div className="ca-divider" />
              <p className="ca-file-section-label">Attached by teacher</p>

              <div className="ca-file-row">
                <div className="ca-file-icon-box">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="1" width="10" height="13" rx="1.5" stroke="#D85A30" strokeWidth="1.2" />
                    <path d="M5 5h6M5 8h6M5 11h3" stroke="#D85A30" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="ca-file-meta">
                  <div className="ca-file-name">{teacherFile.name || "Attachment"}</div>
                  <div className="ca-file-size">{teacherFile.size}</div>
                </div>
                <button
                  className="ca-view-btn"
                  onClick={() => window.open(teacherFile.url, "_blank")}
                >
                  View
                </button>
              </div>

              <button
                className={`ca-copy-btn ${copiedTeacher ? "ca-copied" : ""}`}
                onClick={handleCopyTeacherFile}
              >
                {copiedTeacher ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 22 22" fill="none">
                      <polyline points="4,11 9,16 18,6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy file link
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Column 3 */}
        <div className="ca-col" style={{ animationDelay: "0.3s" }}>
          <p className="ca-col-label" style={{ marginBottom: "10px" }}>Your submission</p>

          <div className="ca-submitted-hero">
            <div className="ca-check-ring">
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                <polyline
                  points="4,11 9,16 18,6"
                  stroke="#1D9E75"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="ca-hero-label">Successfully submitted</p>
            <p className="ca-hero-sub">Your work has been sent to your teacher</p>
          </div>

          <div className="ca-submission-meta">
            {submittedOn && (
              <div className="ca-sm-row">
                <span className="ca-sm-key">Submitted on</span>
                <span className="ca-sm-val">{submittedOn}</span>
              </div>
            )}
            <div className="ca-sm-row">
              <span className="ca-sm-key">Submission status</span>
              <span className={`ca-sm-val ${submissionStatus === "On time" ? "green" : "amber"}`}>
                {submissionStatus}
              </span>
            </div>
            {fileType && (
              <div className="ca-sm-row">
                <span className="ca-sm-key">File type</span>
                <span className="ca-sm-val">{fileType}</span>
              </div>
            )}
            {submittedFile?.size && submittedFile.size !== "—" && (
              <div className="ca-sm-row">
                <span className="ca-sm-key">File size</span>
                <span className="ca-sm-val">{submittedFile.size}</span>
              </div>
            )}
          </div>

          {submittedFile?.url && (
            <div className="ca-action-row">
              <button
                className="ca-view-file-btn"
                onClick={() => window.open(submittedFile.url, "_blank")}
              >
                <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                  <path d="M1 7.5C1 7.5 3.5 3 7.5 3C11.5 3 14 7.5 14 7.5C14 7.5 11.5 12 7.5 12C3.5 12 1 7.5 1 7.5Z" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                View submitted file
              </button>

              <div className="ca-tooltip">
                <button
                  className={`ca-icon-btn ${copiedStudent ? "ca-copied" : ""}`}
                  onClick={handleCopyStudentFile}
                >
                  {copiedStudent ? (
                    <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
                      <polyline points="4,11 9,16 18,6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
                <span className="ca-tooltip-text">Copy file link</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CompletedAssignment;