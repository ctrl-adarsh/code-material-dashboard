import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import { Loader2, PlusCircle, BookOpen } from "lucide-react";
import Library from "./Library";
import "./App.css";

// --- DASHBOARD (HOME) COMPONENT ---
// --- INSIDE src/App.jsx ---

function Dashboard() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // New State for feedback messages
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '...' }

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) await supabase.auth.signInAnonymously();
    };
    initAuth();
  }, []);

  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setMessage(null); // Clear previous messages

    try {
      const { data, error } = await supabase.functions.invoke("analyze-video", {
        body: { url, user_id: (await supabase.auth.getUser()).data.user.id },
      });

      if (error) throw error;
      if (data && data.error) throw new Error(data.error);

      // Success Feedback
      setMessage({
        type: "success",
        text: "✅ Successfully added to Library!",
      });
      setUrl("");

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      // Error Feedback
      setMessage({ type: "error", text: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🚀 Coding Brain</h1>
        <p>Paste any link (YouTube, Blogs, Docs) to build your curriculum.</p>
      </header>

      <form onSubmit={handleAddVideo} className="input-group">
        <input
          type="text"
          placeholder="Paste link here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="spin" />
          ) : (
            <>
              <PlusCircle size={18} /> Analyze
            </>
          )}
        </button>
      </form>

      {/* --- STATUS MESSAGE DISPLAY --- */}
      {message && (
        <div className={`status-message ${message.type}`}>{message.text}</div>
      )}

      <div className="empty-state">
        <h3>Ready to Review?</h3>
        <p>Go to your Library to see your smart-grouped collection.</p>
        <Link to="/library" className="btn-cta">
          Go to Library
        </Link>
      </div>
    </div>
  );
}
// --- NAVBAR COMPONENT ---
function NavBar() {
  const location = useLocation();
  return (
    <nav className="navbar">
      <Link to="/" className={location.pathname === "/" ? "active" : ""}>
        <PlusCircle size={20} /> Add New
      </Link>
      <Link
        to="/library"
        className={location.pathname === "/library" ? "active" : ""}
      >
        <BookOpen size={20} /> Library
      </Link>
    </nav>
  );
}

// --- MAIN APP SHELL ---
export default function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/library" element={<Library />} />
      </Routes>
    </Router>
  );
}
