import { useParticipants, useRoomContext } from "@livekit/components-react";
import { useEffect, useState } from "react";

export default function ParticipantsPanel() {
  const participants = useParticipants();
  const room = useRoomContext();

  const [open, setOpen] = useState(true);
  const [raisedHands, setRaisedHands] = useState({});

  useEffect(() => {
    const decoder = new TextDecoder();

    const handleData = (payload, participant) => {
      try {
        const msg = JSON.parse(decoder.decode(payload));

        const id = participant?.identity || msg.sender;
        if (!id) return;

        // ✋ RAISE HAND
        if (msg.type === "RAISE_HAND") {
          setRaisedHands((prev) => ({
            ...prev,
            [id]: true,
          }));
        }

        // 👇 LOWER HAND
        if (msg.type === "LOWER_HAND") {
          setRaisedHands((prev) => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
          });
        }
      } catch {}
    };

    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room]);

  return (
    <div className="participants-wrapper">
      <div
        className="participants-header"
        onClick={() => setOpen(!open)}
      >
        <span>Participants ({participants.length})</span>
        <span>{open ? "▾" : "▸"}</span>
      </div>

      {open && (
        <div className="participants-row">
          {participants.map((p) => (
            <div
              key={p.identity}
              className={`participant-card ${
                raisedHands[p.identity] ? "hand-raised" : ""
              }`}
            >
              <div className="participant-avatar">
                {p.identity.charAt(0).toUpperCase()}
              </div>

              <div className="participant-name">
                {p.identity}
                {raisedHands[p.identity] && (
                  <span className="raised-hand-icon"> ✋</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}