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
  async requestSession(formData) {
    const payload = {
      teacher_id: formData.teacher_id,
      subject_id: formData.subject_id,
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time,
      duration_minutes: formData.duration_minutes,
      session_type: formData.session_type || "one_on_one",
      group_strength: formData.group_strength || 1,
      notes: formData.notes || "",
      student_ids: formData.student_ids || [],
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

  // ── Teachers for a subject (by UUID) ──
  async getTeachers(subjectId) {
    if (!subjectId) return [];
    const res = await api.get(`/sessions/subjects/${subjectId}/teachers/`);
    return res.data || [];
  },

  // ── Validate student ID (for group form) ──
  async validateStudentId(studentId) {
    const res = await api.get(`/accounts/student/${studentId}/validate/`);
    return res.data; // { valid, name, user_id, student_id }
  },

  // ── Only subjects for THIS student's enrolled course ──
  async getSubjectsByCourse() {
    const res = await api.get("/courses/subjects/mine/");
    return res.data || [];
  },

  // ── Teacher-side methods (used by teacher dashboard) ──
  async getTeacherSessions() {
    const res = await api.get("/sessions/teacher/sessions/");
    return res.data.map(transformSession);
  },

  async getRequests() {
    const res = await api.get("/sessions/teacher/requests/");
    return res.data.map(transformSession);
  },

  async getHistory() {
    const res = await api.get("/sessions/teacher/history/");
    return res.data.map(transformSession);
  },

  async acceptRequest(sessionId, data = {}) {
    const res = await api.post(`/sessions/${sessionId}/accept/`, data);
    return transformSession(res.data);
  },

  async declineRequest(sessionId, reason = "") {
    const res = await api.post(`/sessions/${sessionId}/decline/`, { reason });
    return transformSession(res.data);
  },

  async rescheduleRequest(sessionId, { new_date, new_time, note = "" }) {
    const res = await api.post(`/sessions/${sessionId}/reschedule/`, {
      scheduled_date: new_date,
      scheduled_time: new_time,
      reason: note,
    });
    return transformSession(res.data);
  },

  async startSession(sessionId) {
    const res = await api.post(`/sessions/${sessionId}/start/`);
    return transformSession(res.data);
  },

  async endSession(sessionId) {
    const res = await api.post(`/sessions/${sessionId}/end/`);
    return transformSession(res.data);
  },

  async teacherCancelSession(sessionId, reason = "") {
    const res = await api.post(`/sessions/${sessionId}/teacher-cancel/`, { reason });
    return transformSession(res.data);
  },

  async getAvailability() {
    try {
      const res = await api.get("/sessions/teacher/availability/");
      return res.data;
    } catch {
      return {};
    }
  },

  async saveAvailability(data) {
    try {
      const res = await api.post("/sessions/teacher/availability/", data);
      return res.data;
    } catch {
      return { success: false };
    }
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
  DAYS: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

/**
 * Transform backend response → frontend-friendly shape.
 */
function transformSession(s) {
  const actualDur = s.actual_duration_minutes;
  const scheduledDur = s.duration_minutes;
  const displayDur = actualDur || scheduledDur;
  return {
    id: s.id,
    subject: s.subject,
    topic: s.subject,
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
    rescheduledDate: s.rescheduled_date,
    rescheduledTime: s.rescheduled_time,
    rescheduleReason: s.reschedule_reason,
    teacherNote: s.reschedule_reason,
    originalDate: s.rescheduled_date ? s.scheduled_date : null,
    originalTime: s.rescheduled_time ? s.scheduled_time : null,
    participants: s.participants || [],
    students: (s.participants || []).map((p) => p.name),
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    startedAt: s.started_at,
    endedAt: s.ended_at,
    declineReason: s.decline_reason,
    cancelReason: s.cancel_reason,
  };
}

export default privateSession;