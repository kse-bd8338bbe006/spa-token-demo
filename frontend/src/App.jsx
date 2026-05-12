import { useState, useEffect, useCallback } from "react";
import keycloak from "./keycloak.js";
import { fetchNotes, createNote, deleteNote } from "./api.js";

function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [tokenPayload, setTokenPayload] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const [keycloakReady, setKeycloakReady] = useState(false);

  useEffect(() => {
    keycloak
      .init({ onLoad: "check-sso", checkLoginIframe: false })
      .then((auth) => {
        setKeycloakReady(true);
        if (auth) {
          handleAuthenticated();
        }
      })
      .catch((err) => {
        console.error("Keycloak init failed", err);
        setKeycloakReady(true);
      });
  }, []);

  function handleAuthenticated() {
    const token = keycloak.token;
    // Store token in localStorage (deliberate choice for demo purposes)
    localStorage.setItem("access_token", token);
    setAuthenticated(true);
    setUsername(keycloak.tokenParsed?.preferred_username || "unknown");
    setTokenPayload(decodeJwtPayload(token));

    // Refresh token before it expires
    setInterval(() => {
      keycloak
        .updateToken(30)
        .then((refreshed) => {
          if (refreshed) {
            localStorage.setItem("access_token", keycloak.token);
            setTokenPayload(decodeJwtPayload(keycloak.token));
          }
        })
        .catch(() => {
          console.error("Token refresh failed");
          handleLogout();
        });
    }, 30000);
  }

  const loadNotes = useCallback(async () => {
    try {
      setError("");
      const data = await fetchNotes();
      setNotes(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadNotes();
    }
  }, [authenticated, loadNotes]);

  function handleLogin() {
    keycloak.login().then(() => handleAuthenticated());
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    setAuthenticated(false);
    setUsername("");
    setNotes([]);
    setTokenPayload(null);
    keycloak.logout({ redirectUri: window.location.origin });
  }

  async function handleCreateNote(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setError("");
      await createNote(title.trim(), content.trim());
      setTitle("");
      setContent("");
      await loadNotes();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteNote(id) {
    try {
      setError("");
      await deleteNote(id);
      await loadNotes();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!keycloakReady) {
    return (
      <div style={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={styles.container}>
        <h1>SPA Token Demo</h1>
        <p>Token-based authentication with Keycloak</p>
        <button onClick={handleLogin} style={styles.button}>
          Log in with Keycloak
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>SPA Token Demo</h1>
        <div>
          Logged in as <strong>{username}</strong>{" "}
          <button onClick={handleLogout} style={styles.buttonSmall}>
            Log out
          </button>
        </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      {/* Create note form */}
      <section style={styles.section}>
        <h2>Create Note</h2>
        <form onSubmit={handleCreateNote} style={styles.form}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
          />
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Add Note
          </button>
        </form>
      </section>

      {/* Notes list */}
      <section style={styles.section}>
        <h2>My Notes</h2>
        {notes.length === 0 ? (
          <p>No notes yet.</p>
        ) : (
          <ul style={styles.noteList}>
            {notes.map((note) => (
              <li key={note.id} style={styles.noteItem}>
                <div>
                  <strong>{note.title}</strong>
                  <p style={styles.noteContent}>{note.content}</p>
                  <small style={styles.noteDate}>
                    {new Date(note.createdAt).toLocaleString()}
                  </small>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* JWT Token Inspector */}
      <section style={styles.section}>
        <h2>
          JWT Token Inspector{" "}
          <button
            onClick={() => setShowToken(!showToken)}
            style={styles.buttonSmall}
          >
            {showToken ? "Hide" : "Show"}
          </button>
        </h2>
        {showToken && tokenPayload && (
          <div>
            <p style={{ fontSize: "0.85em", color: "#666" }}>
              This token is stored in <code>localStorage</code> -- open DevTools
              {" -> "} Application {" -> "} Local Storage to see it.
            </p>
            <pre style={styles.tokenBlock}>
              {JSON.stringify(tokenPayload, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 700,
    margin: "0 auto",
    padding: "2rem 1rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #ddd",
    paddingBottom: "1rem",
    marginBottom: "1.5rem",
  },
  section: {
    marginBottom: "2rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  input: {
    padding: "0.5rem",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: 4,
  },
  button: {
    padding: "0.6rem 1.2rem",
    fontSize: "1rem",
    backgroundColor: "#1a73e8",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  buttonSmall: {
    padding: "0.3rem 0.8rem",
    fontSize: "0.85rem",
    backgroundColor: "#555",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  error: {
    padding: "0.8rem",
    backgroundColor: "#fdd",
    color: "#900",
    borderRadius: 4,
    marginBottom: "1rem",
  },
  noteList: {
    listStyle: "none",
    padding: 0,
  },
  noteItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "0.8rem",
    borderBottom: "1px solid #eee",
  },
  noteContent: {
    margin: "0.3rem 0",
    color: "#555",
  },
  noteDate: {
    color: "#999",
  },
  deleteButton: {
    padding: "0.3rem 0.6rem",
    fontSize: "0.85rem",
    backgroundColor: "#d32f2f",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  tokenBlock: {
    backgroundColor: "#f5f5f5",
    padding: "1rem",
    borderRadius: 4,
    overflow: "auto",
    fontSize: "0.85rem",
    maxHeight: 400,
  },
};

export default App;
