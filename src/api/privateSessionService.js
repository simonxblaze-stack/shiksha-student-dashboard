/**
 * FILE: STUDENT_DASHBOARD/src/api/privateSessionService.js
 *
 * Connects to:
 *   - sessions_app  → /api/sessions/...
 *   - accounts      → /api/accounts/teachers/, /api/accounts/student/.../validate/
 */

import api from "./apiClient";

const privateSession = {

  // ── Sessions by tab ──
  async getSessions(tab) {
    const res = await api.get("/sessions/student/", { params: { tab } });
    return res.data.map(transformSession);
  },

  // ── Detail ──
  async getSessionDetail(id) {
    const res = await api.get(`/sessions/${id}/`);
    return transformSession(res.data);
  },

  // ── Request a session ──
  // Accepts frontend field names → maps to backend field names
  async requestSession(formData) {
    const payload = {
      teacher_id: formData.teacherId,
      subject: formData.subject,
      scheduled_date: formData.scheduledDate,
      scheduled_time: formData.scheduledTime,
      duration_minutes: formData.durationMinutes,
      session_type: formData.studentIds && formData.studentIds.length > 0 ? "group" : "one_on_one",
      group_strength: (formData.studentIds?.length || 0) + 1, // +1 for requester
      notes: formData.note || "",
      student_ids: formData.studentIds || [],
    };
    const res = await api.post("/sessions/request/", payload);
    return transformSession(res.data);
  },

  // ── Cancel ──
  async cancelSession(sessionId, reason = "") {
    const res = await api.post(`/sessions/${sessionId}/cancel/`, { reason });
    return transformSession(res.data);
  },

  // ── Reschedule responses ──
  async confirmReschedule(sessionId) {
    const res = await api.post(`/sessions/${sessionId}/confirm-reschedule/`);
    return transformSession(res.data);
  },

  async declineReschedule(sessionId) {
    const res = await api.post(`/sessions/${sessionId}/decline-reschedule/`);
    return transformSession(res.data);
  },

  // ── LiveKit — join ongoing session ──
  async joinSession(sessionId) {
    const res = await api.post(`/sessions/${sessionId}/join/`);
    return res.data; // { livekit_url, token, room, role }
  },

  // ── Teachers list (for request form) ──
  async getTeachers(subject) {
    const params = subject ? { subject } : {};
    const res = await api.get("/accounts/teachers/", { params });
    return res.data;
  },

  // ── Validate student ID (for group form) ──
  async validateStudentId(studentId) {
    const res = await api.get(`/accounts/student/${studentId}/validate/`);
    return res.data; // { valid, name, user_id, student_id }
  },

  // ── Constants ──
  SUBJECTS: ["Mathematics", "Science", "Physics", "Chemistry", "English", "History", "Biology"],
  TIME_SLOTS: [
    { label: "3:00 PM - 5:00 PM", value: "15:00" },
    { label: "5:00 PM - 7:00 PM", value: "17:00" },
    { label: "7:00 PM - 9:00 PM", value: "19:00" },
  ],
  DURATIONS: [
    { label: "30 minutes", value: 30 },
    { label: "60 minutes", value: 60 },
    { label: "90 minutes", value: 90 },
  ],
};

/**
 * Transform backend response → frontend-friendly shape.
 * Backend returns: teacher_name, scheduled_date, scheduled_time, etc.
 * Frontend expects: teacher, date, time, etc.
 */
function transformSession(s) {
  // Prefer actual_duration_minutes (computed from started_at/ended_at) over scheduled duration
  const actualDur = s.actual_duration_minutes;
  const scheduledDur = s.duration_minutes;
  const displayDur = actualDur || scheduledDur;
  return {
    id: s.id,
    subject: s.subject,
    topic: s.subject, // backend doesn't have a separate topic field
    teacher: s.teacher_name,
    teacherId: s.teacher_id,
    requestedBy: s.student_name,
    requestedById: s.requested_by_id,
    studentId: s.student_id,
    date: s.scheduled_date,
    time: s.scheduled_time,
    duration: displayDur ? `${displayDur} mins` : "",
    durationMinutes: s.duration_minutes,
    actualDurationMinutes: s.actual_duration_minutes,
    status: s.status,
    sessionType: s.session_type,
    groupStrength: s.group_strength,
    note: s.notes,
    notes: s.notes,
    roomName: s.room_name,
    // Reschedule fields
    rescheduledDate: s.rescheduled_date,
    rescheduledTime: s.rescheduled_time,
    rescheduleReason: s.reschedule_reason,
    teacherNote: s.reschedule_reason,
    originalDate: s.rescheduled_date ? s.scheduled_date : null,
    originalTime: s.rescheduled_time ? s.scheduled_time : null,
    // Participants (for group sessions)
    participants: s.participants || [],
    students: (s.participants || []).map((p) => p.name),
    // Timestamps
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    startedAt: s.started_at,
    endedAt: s.ended_at,
    declineReason: s.decline_reason,
    cancelReason: s.cancel_reason,
  };
}

export default privateSession;