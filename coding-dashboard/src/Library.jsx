import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  PlayCircle,
  FileText,
  Trash2,
  FolderOpen,
  ExternalLink,
} from "lucide-react";
import "./App.css";

export default function Library() {
  const [groupedVideos, setGroupedVideos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from("completed_videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        // Group by Topic
        const groups = data.reduce((acc, item) => {
          const topic = item.topic || "Uncategorized";
          if (!acc[topic]) acc[topic] = [];
          acc[topic].push(item);
          return acc;
        }, {});
        setGroupedVideos(groups);
      }
      setLoading(false);
    };

    fetchVideos();
  }, []);

  const handleDelete = async (id, topic) => {
    if (!confirm("Are you sure you want to delete this?")) return;

    // Optimistic UI Update
    const newGroups = { ...groupedVideos };
    newGroups[topic] = newGroups[topic].filter((v) => v.id !== id);
    if (newGroups[topic].length === 0) delete newGroups[topic];
    setGroupedVideos(newGroups);

    await supabase.from("completed_videos").delete().eq("id", id);
  };

  const getIcon = (type) => {
    if (type === "Video") return <PlayCircle size={16} />;
    return <FileText size={16} />;
  };

  if (loading)
    return (
      <div
        className="container"
        style={{ textAlign: "center", marginTop: "50px" }}
      >
        Loading Library...
      </div>
    );

  return (
    <div className="container">
      <header className="header">
        <h1>📚 Knowledge Library</h1>
        <p>Your curriculum, organized by AI</p>
      </header>

      {Object.keys(groupedVideos).length === 0 ? (
        <div className="empty-state">
          No resources yet. Go to Home to add some!
        </div>
      ) : (
        Object.entries(groupedVideos).map(([topic, videos]) => (
          <div key={topic} className="topic-section">
            <div className="topic-header">
              <FolderOpen size={24} color="#3b82f6" />
              <h2>
                {topic} <span className="count">({videos.length})</span>
              </h2>
            </div>

            <div className="grid">
              {videos.map((item) => (
                <div key={item.id} className="card">
                  {/* Image or Placeholder Gradient */}
                  <div
                    className="card-image"
                    style={
                      !item.thumbnail
                        ? {
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          }
                        : {}
                    }
                  >
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} />
                    ) : (
                      <div className="article-placeholder">
                        <FileText size={48} color="rgba(255,255,255,0.3)" />
                      </div>
                    )}
                    <span className={`badge ${item.difficulty}`}>
                      {item.difficulty}
                    </span>
                  </div>

                  <div className="card-content">
                    <h4>{item.title}</h4>
                    <div className="meta-row">
                      <span className="type-tag">
                        {item.content_type || "Resource"}
                      </span>
                    </div>
                    <p className="summary">{item.summary}</p>
                    <div className="tags">
                      {item.tags?.map((tag, i) => (
                        <span key={i} className="tag">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="actions">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-link"
                      >
                        {getIcon(item.content_type)} Open
                      </a>
                      <button
                        onClick={() => handleDelete(item.id, topic)}
                        className="btn-delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
