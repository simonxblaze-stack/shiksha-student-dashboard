import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import api from "../api/apiClient";
import ClassroomUI from "../components/live/ClassroomUI";
import TeacherControls from "../components/live/TeacherControls";

export default function LiveSessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    const joinSession = async () => {
      try {
        const res = await api.post(
          `https://api.shikshacom.com/api/livestream/sessions/${id}/join/`
        );
        setData(res.data);
      } catch (err) {
        console.error(err);
        alert("You cannot join this session.");
        navigate(-1);
      }
    };

    joinSession();
  }, [id, navigate]);

  if (!data) return <div style={{ padding: 20 }}>Joining session...</div>;

  const isTeacher = data.role === "TEACHER";

  return (
    <LiveKitRoom
      serverUrl={data.livekit_url}
      token={data.token}
      connect={true}
      video={isTeacher}
      audio={true}
    >
      <ClassroomUI role={data.role} />
      {isTeacher && <TeacherControls />}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}