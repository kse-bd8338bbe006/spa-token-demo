const API_BASE = import.meta.env.VITE_API_URL || "/api";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchNotes() {
  const res = await fetch(`${API_BASE}/notes`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch notes: ${res.status}`);
  return res.json();
}

export async function createNote(title, content) {
  const res = await fetch(`${API_BASE}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error(`Failed to create note: ${res.status}`);
  return res.json();
}

export async function deleteNote(id) {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete note: ${res.status}`);
}
