import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/studyMaterialDetail.css";

export default function StudyMaterialDetail() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [copiedNote, setCopiedNote] = useState(false);
  const [activeFile, setActiveFile] = useState(null);

  useEffect(() => {
    api.get(`/materials/materials/${id}/`)
      .then((res) => {
        setMaterial(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleView = (file) => {
    setViewingId(file.id);
    setActiveFile(file.id);
    setTimeout(() => {
      setViewingId(null);
      window.open(file.file_url);
    }, 400);
  };

  const handleDownload = (file) => {
    setDownloadingId(file.id);
    setTimeout(() => setDownloadingId(null), 1200);
  };

  const handleCopyNote = () => {
    if (!material?.description) return;
    navigator.clipboard.writeText(material.description).then(() => {
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
    });
  };

  const getFileExt = (name = "") => name.split(".").pop().toUpperCase() || "FILE";

  const getExtColor = (ext) => {
    const map = { PDF: "#e74c3c", DOC: "#2980b9", DOCX: "#2980b9", PPT: "#e67e22", PPTX: "#e67e22", XLS: "#27ae60", XLSX: "#27ae60" };
    return map[ext] || "#7f8c8d";
  };

  if (loading) return (
    <div className="smd-page">
      <div className="smd-skeleton-header" />
      <div className="smd-skeleton-body" />
    </div>
  );

  if (!material) return (
    <div className="smd-page">
      <button className="smd-back" onClick={() => navigate(-1)}>&lt; Back</button>
      <div className="smd-error">Could not load material.</div>
    </div>
  );

  const fileCount = material.files?.length || 0;

  return (
    <div className="smd-page">

      <button className="smd-back" onClick={() => navigate(-1)}>
        &lt; Back
      </button>

      <div className="smd-header">
        <h2>{material.subject_name || "Subject"}</h2>
      </div>

      <div className="smd-wrapper">

        {/* LEFT */}
        <div className="smd-left">

          <div className="smd-topic-row">
            <h3 className="smd-topic">{material.title}</h3>
            {material.chapter_title && (
              <span className="smd-chapter-badge">{material.chapter_title}</span>
            )}
          </div>

          <div className="smd-meta-row">
            <span className="smd-meta-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              {new Date(material.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className="smd-meta-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/><path d="M14 2v6h6" stroke="currentColor" strokeWidth="2"/></svg>
              {fileCount} file{fileCount !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="smd-note">
            <div className="smd-note-label-row">
              <p className="smd-note-label">Note:</p>
              <button
                className={`smd-copy-btn ${copiedNote ? "copied" : ""}`}
                onClick={handleCopyNote}
                title="Copy note"
              >
                {copiedNote ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/></svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="smd-note-box">
              {material.description || "No note provided"}
            </div>
          </div>

        </div>

        {/* RIGHT */}
        <div className="smd-files-panel">

          <div className="smd-files-header">
            <span>Files</span>
            <span className="smd-files-count">{fileCount}</span>
          </div>

          <div className="smd-files-list">

            {fileCount === 0 ? (
              <div className="smd-no-files">No files attached</div>
            ) : (
              material.files.map((file, i) => {
                const ext = getFileExt(file.file_name);
                const isActive = activeFile === file.id;
                return (
                  <div
                    key={file.id}
                    className={`smd-file-card ${isActive ? "active" : ""}`}
                    style={{ animationDelay: `${i * 80}ms` }}
                    onClick={() => setActiveFile(isActive ? null : file.id)}
                  >
                    <div className="smd-file-info">

                      <div className="smd-file-icon-wrap" style={{ background: getExtColor(ext) + "22" }}>
                        <span className="smd-file-ext" style={{ color: getExtColor(ext) }}>{ext}</span>
                      </div>

                      <div className="smd-file-text">
                        <p className="smd-file-name" title={file.file_name}>{file.file_name}</p>
                        <span className="smd-file-size">{file.file_size || "—"}</span>
                      </div>
                    </div>

                    <div className="smd-file-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className={`smd-view-btn ${viewingId === file.id ? "loading" : ""}`}
                        onClick={() => handleView(file)}
                      >
                        {viewingId === file.id ? "Opening..." : "View"}
                      </button>

                      <a
                        href={file.file_url}
                        download={file.file_name}
                        className={`smd-download-btn ${downloadingId === file.id ? "downloading" : ""}`}
                        onClick={() => handleDownload(file)}
                        title="Download"
                      >
                        {downloadingId === file.id ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3v13M7 12l5 5 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 20h14" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                        )}
                      </a>
                    </div>

                  </div>
                );
              })
            )}

          </div>

        </div>

      </div>

    </div>
  );
}