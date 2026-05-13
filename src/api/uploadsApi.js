import { apiUrl } from "../config/env";
import { apiFetch } from "../lib/apiClient";

export async function uploadProfileAvatar(file, token) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(apiUrl("/api/v1/uploads/profile/avatar"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Avatar upload failed.");
  return data;
}

export async function uploadProfileBanner(file, token) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(apiUrl("/api/v1/uploads/profile/banner"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Banner upload failed.");
  return data;
}

export async function uploadCommunityImage(file, token) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch(apiUrl("/api/v1/uploads/community/image"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Image upload failed.");
  return data;
}

export async function uploadCommunityVideo(file, token) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch(apiUrl("/api/v1/uploads/community/video"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Video upload failed.");
  return data;
}

export async function uploadCourseThumbnail(courseId, file, adminKey) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(apiUrl(`/api/v1/courses/admin/courses/${encodeURIComponent(courseId)}/thumbnail`), {
    method: "POST",
    headers: {
      "X-CCWEB-Admin": adminKey || "",
    },
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Thumbnail upload failed.");
  return data;
}
