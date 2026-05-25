import { http } from "./http";

export async function listStreamRooms() {
  const { data } = await http.get("/api/streaming/rooms");
  return data;
}

export async function createStreamRoom(body) {
  const { data } = await http.post("/api/streaming/rooms", body);
  return data;
}

export async function getStreamRoom(roomId) {
  const { data } = await http.get(`/api/streaming/rooms/${encodeURIComponent(roomId)}`);
  return data;
}

export async function listAttendance(roomId) {
  const { data } = await http.get(`/api/streaming/rooms/${encodeURIComponent(roomId)}/attendance`);
  return data;
}

export async function upsertAttendance(roomId, body) {
  const { data } = await http.post(`/api/streaming/rooms/${encodeURIComponent(roomId)}/attendance`, body);
  return data;
}

export async function finishRoom(roomId, body = {}) {
  const { data } = await http.post(`/api/streaming/rooms/${encodeURIComponent(roomId)}/finish`, body);
  return data;
}

export async function quoteAccess(streamRoomId, hours = 1) {
  const { data } = await http.get("/api/learning/access/quote", {
    params: { streamRoomId, hours },
  });
  return data;
}

export async function fetchLearningSessions(params = {}) {
  const { data } = await http.get("/api/learning/sessions", { params });
  return data;
}

export async function fetchLearningProfile(userId) {
  const { data } = await http.get("/api/learning/me", { params: { userId } });
  return data;
}

export async function prepareLearningFlutterwave(payload) {
  const { data } = await http.post("/api/v1/learning/payments/flutterwave/prepare", payload);
  return data;
}

export async function verifyFlutterwavePayment(txRef) {
  const { data } = await http.post("/api/v1/payments/flutterwave/verify", { tx_ref: txRef });
  return data;
}

export async function postTutorMessage(body) {
  const { data } = await http.post("/api/learning/tutor/message", body);
  return data;
}

export async function fetchChannelMessages(streamRoomId) {
  const { data } = await http.get(`/api/learning/sessions/${encodeURIComponent(streamRoomId)}/channel`);
  return data;
}

export async function postChannelMessage(streamRoomId, body) {
  const { data } = await http.post(`/api/learning/sessions/${encodeURIComponent(streamRoomId)}/channel`, body);
  return data;
}

export async function fetchSessionDetail(streamRoomId) {
  const { data } = await http.get(`/api/learning/sessions/${encodeURIComponent(streamRoomId)}/detail`);
  return data;
}

export async function fetchLearningAdminAnalytics(adminKey, params = {}) {
  const { data } = await http.get("/api/learning/admin/analytics", {
    headers: { "X-CCWEB-Admin": adminKey },
    params,
  });
  return data;
}
