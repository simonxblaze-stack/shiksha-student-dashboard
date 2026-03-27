import {
  useRoomContext,
  useLocalParticipant,
} from "@livekit/components-react";
import { useState } from "react";

export default function ControlBar() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!micOn);
    setMicOn(!micOn);
  };

  const toggleCam = async () => {
    await localParticipant.setCameraEnabled(!camOn);
    setCamOn(!camOn);
  };

  const leaveRoom = async () => {
    await room.disconnect();
    window.history.back();
  };

  return (
    <div className="control-bar">
      <button onClick={toggleMic} className={!micOn ? "off" : ""}>
        🎤 {micOn ? "On" : "Off"}
      </button>

      <button onClick={toggleCam} className={!camOn ? "off" : ""}>
        🎥 {camOn ? "On" : "Off"}
      </button>

      <button onClick={leaveRoom}>
        ❌ Leave
      </button>
    </div>
  );
}