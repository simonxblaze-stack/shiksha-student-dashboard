import { useTracks, VideoTrack } from "@livekit/components-react";
import { Track } from "livekit-client";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";
import RaiseHandButton from "./RaiseHandButton";
import ControlBar from "./ControlBar";
import { useState } from "react";

export default function ClassroomUI({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  // 🔥 BEST WAY: detect teacher (publisher)
  const teacherTrack = tracks.find(
    (t) => t.participant.permissions?.canPublish
  );

  if (!teacherTrack) {
    return (
      <div className="waiting-screen">
        <h2>Waiting for teacher to start…</h2>
      </div>
    );
  }

  return (
    <div className="classroom-layout">
      {/* MAIN VIDEO */}
      <div className={`main-stage ${sidebarOpen ? "" : "full-width"}`}>
        <button
          className="toggle-sidebar-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? "Hide Panel" : "Show Panel"}
        </button>

        <VideoTrack trackRef={teacherTrack} />
      </div>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <div className="right-sidebar">
          <ParticipantsPanel />
          <ChatPanel role={role} />
        </div>
      )}

      {/* CONTROLS */}
      <ControlBar />

      {/* STUDENT ONLY */}
      {role === "STUDENT" && <RaiseHandButton />}
    </div>
  );
}