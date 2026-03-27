import { useRoomContext } from "@livekit/components-react";
import { useState } from "react";

export default function RaiseHandButton() {
  const room = useRoomContext();
  const [raised, setRaised] = useState(false);

  const toggleHand = async () => {
    const encoder = new TextEncoder();

    const type = raised ? "LOWER_HAND" : "RAISE_HAND";

    await room.localParticipant.publishData(
      encoder.encode(JSON.stringify({ type })),
      { reliable: true }
    );

    setRaised(!raised);
  };

  return (
    <button
      className="raise-hand-btn"
      onClick={toggleHand}
      title={raised ? "Lower hand" : "Raise hand"}
    >
      {raised ? "👇" : "✋"}
    </button>
  );
}