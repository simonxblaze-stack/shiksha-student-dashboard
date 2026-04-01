import api from "./apiClient";

/* Student session lists */
export async function getSessions(tab = "scheduled") {
  const res = await api.get(`/private-sessions/student/?tab=${tab}`);
  return res.data;
}

/* Session detail */
export async function getSessionDetail(sessionId) {
  const res = await api.get(`/private-sessions/${sessionId}/`);
  return res.data;
}

/* Request a new session */
export async function requestSession(data) {
  const res = await api.post(`/private-sessions/request/`, data);
  return res.data;
}

/* Student actions */
export async function cancelSession(sessionId, reason = "") {
  const res = await api.post(`/private-sessions/${sessionId}/cancel/`, { reason });
  return res.data;
}

export async function confirmReschedule(sessionId) {
  const res = await api.post(`/private-sessions/${sessionId}/confirm-reschedule/`);
  return res.data;
}

export async function declineReschedule(sessionId, reason = "") {
  const res = await api.post(`/private-sessions/${sessionId}/decline-reschedule/`, {
    reason,
  });
  return res.data;
}

export async function leaveSession(sessionId) {
  const res = await api.post(`/private-sessions/${sessionId}/cancel/`, {
    reason: "Student left the session.",
  });
  return res.data;
}

/* Teachers list */
export async function getTeachers() {
  try {
    const res = await api.get(`/accounts/teachers/`);
    return res.data;
  } catch (error) {
    console.warn("Teachers list endpoint failed:", error);
    return [];
  }
}

export async function validateStudentId(studentId) {
  try {
    const res = await api.get(
      `/accounts/validate-student/?student_id=${encodeURIComponent(studentId)}`
    );
    return res.data;
  } catch {
    return { valid: false };
  }
}

/* LiveKit */
export async function getLiveKitToken(sessionId) {
  const res = await api.post(`/private-sessions/${sessionId}/join/`);
  return res.data;
}