"use client";

import { useEffect, useState, useMemo } from "react";
import styles from "./AdminCommentsDashboard.module.css";
import { API_BASE_URL } from "@/config/api";

export default function AdminCommentsDashboard() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'top', 'reply'
  
  // Custom Filtering & Sorting states
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'deleted'
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'oldest', 'username-asc', 'username-desc'
  
  const [commentToDelete, setCommentToDelete] = useState(null); // stores comment object when showing delete modal
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/comments/admin/all`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load admin comments");
      const data = await res.json();
      setComments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (comment) => {
    setCommentToDelete(comment);
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/comments/${commentToDelete._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete comment");
      
      // Update UI state: Mark comment as soft-deleted in local state
      setComments((prev) => 
        prev.map((c) => {
          if (c._id === commentToDelete._id) {
            return { ...c, isDeleted: true };
          }
          // If a top-level comment was deleted, also mark its replies as deleted
          if (!commentToDelete.parentComment && c.parentComment === commentToDelete._id) {
            return { ...c, isDeleted: true };
          }
          return c;
        })
      );
      
      setCommentToDelete(null);
    } catch (err) {
      alert(`Error deleting comment: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRestoreClick = async (comment) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/comments/${comment._id}/restore`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to restore comment");
      
      // Update UI state: Mark comment as active (not deleted)
      setComments((prev) => 
        prev.map((c) => {
          if (c._id === comment._id) {
            return { ...c, isDeleted: false };
          }
          // If a top-level comment was restored, also restore its replies
          if (!comment.parentComment && c.parentComment === comment._id) {
            return { ...c, isDeleted: false };
          }
          return c;
        })
      );
    } catch (err) {
      alert(`Error restoring comment: ${err.message}`);
    }
  };

  // Real-time Analytics Calculations
  const totalComments = comments.length;
  const topLevelCommentsCount = comments.filter((c) => !c.parentComment).length;
  const repliesCount = comments.filter((c) => c.parentComment).length;
  const activeBlogsCount = new Set(comments.map((c) => c.blog?._id).filter(Boolean)).size;

  // Search & Filter Processing
  const filteredComments = useMemo(() => {
    let result = [...comments];

    // 1. Search filter (checks name, content, blog title)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.user?.name?.toLowerCase().includes(q) ||
          c.content?.toLowerCase().includes(q) ||
          c.blog?.title?.toLowerCase().includes(q)
      );
    }

    // 2. Type filter
    if (filterType === "top") {
      result = result.filter((c) => !c.parentComment);
    } else if (filterType === "reply") {
      result = result.filter((c) => c.parentComment);
    }

    // 3. Status filter
    if (statusFilter === "active") {
      result = result.filter((c) => !c.isDeleted);
    } else if (statusFilter === "deleted") {
      result = result.filter((c) => c.isDeleted);
    }

    // 4. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "oldest":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "username-asc":
          return (a.user?.name || "").localeCompare(b.user?.name || "");
        case "username-desc":
          return (b.user?.name || "").localeCompare(a.user?.name || "");
        default:
          return 0;
      }
    });

    return result;
  }, [comments, searchTerm, filterType, statusFilter, sortBy]);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1>Comment Moderation & Activity Center</h1>
        <p className={styles.subtitle}>Track live notifications, review metrics, and moderate community conversations across all blog posts.</p>
      </div>

      {/* Analytics metrics Grid */}
      <div className={styles.analyticsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(76, 175, 80, 0.1)", color: "#4caf50" }}>💬</div>
          <div className={styles.statInfo}>
            <h3>Total Comments</h3>
            <span className={styles.statVal}>{totalComments}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(33, 150, 243, 0.1)", color: "#2196f3" }}>📌</div>
          <div className={styles.statInfo}>
            <h3>Top-Level</h3>
            <span className={styles.statVal}>{topLevelCommentsCount}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(156, 39, 176, 0.1)", color: "#9c27b0" }}>🔄</div>
          <div className={styles.statInfo}>
            <h3>Replies</h3>
            <span className={styles.statVal}>{repliesCount}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(255, 152, 0, 0.1)", color: "#ff9800" }}>📰</div>
          <div className={styles.statInfo}>
            <h3>Active Blogs</h3>
            <span className={styles.statVal}>{activeBlogsCount}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className={styles.controlsRow}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by username, content or blog title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <div className={styles.filterControl}>
            <label>Type</label>
            <div className={styles.filterGroup}>
              <button 
                className={`${styles.filterBtn} ${filterType === "all" ? styles.active : ""}`}
                onClick={() => setFilterType("all")}
                type="button"
              >
                All
              </button>
              <button 
                className={`${styles.filterBtn} ${filterType === "top" ? styles.active : ""}`}
                onClick={() => setFilterType("top")}
                type="button"
              >
                Top-Level
              </button>
              <button 
                className={`${styles.filterBtn} ${filterType === "reply" ? styles.active : ""}`}
                onClick={() => setFilterType("reply")}
                type="button"
              >
                Replies
              </button>
            </div>
          </div>

          <div className={styles.filterControl}>
            <label>Moderation Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="all">All Comments</option>
              <option value="active">Active Comments</option>
              <option value="deleted">Soft-Deleted</option>
            </select>
          </div>

          <div className={styles.filterControl}>
            <label>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.selectInput}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="username-asc">Username: A-Z</option>
              <option value="username-desc">Username: Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feed Area */}
      {loading ? (
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}></div>
          <p>Loading activity feed...</p>
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <p>❌ Error loading comments: {error}</p>
          <button onClick={fetchComments} className={styles.retryBtn}>Retry</button>
        </div>
      ) : filteredComments.length === 0 ? (
        <div className={styles.emptyContainer}>
          <p>✨ No comments found matching your filters.</p>
        </div>
      ) : (
        <div className={styles.timeline}>
          {filteredComments.map((comment) => (
            <div key={comment._id} className={`${styles.timelineCard} ${comment.isDeleted ? styles.deletedCard : ""}`}>
              {/* User Avatar Column */}
              <img src={comment.user?.image || "/placeholder.jpg"} alt={comment.user?.name} className={styles.userAvatar} />

              {/* Comment Content Column */}
              <div className={styles.cardMain}>
                <div className={styles.cardHeader}>
                  <div className={styles.userInfo}>
                    <strong>{comment.user?.name || "Deleted User"}</strong>
                    <span className={styles.userEmail}>{comment.user?.email}</span>
                  </div>
                  <span className={styles.timeLabel}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className={`${styles.commentContent} ${comment.isDeleted ? styles.deletedContent : ""}`}>
                  "{comment.content}"
                </p>

                {/* Meta details (Target Blog & Nested status) */}
                <div className={styles.cardFooter}>
                  <div className={styles.metaBadgeGroup}>
                    {comment.parentComment ? (
                      <span className={`${styles.badge} ${styles.replyBadge}`}>🔵 Nested Reply</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.topBadge}`}>🟢 Top-Level Comment</span>
                    )}
                    {comment.isDeleted && (
                      <span className={`${styles.badge} ${styles.deletedBadge}`}>🗑️ Soft Deleted</span>
                    )}
                    <span className={styles.blogLinkInfo}>
                      Blog:{" "}
                      <a 
                        href={`/blog/${comment.blog?.slug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.blogTitleLink}
                      >
                        {comment.blog?.title || "Unknown Blog"} ↗
                      </a>
                    </span>
                  </div>

                  {comment.isDeleted ? (
                    <button 
                      onClick={() => handleRestoreClick(comment)} 
                      className={styles.restoreBtn}
                      title="Restore this comment"
                    >
                      🔄 Restore
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleDeleteClick(comment)} 
                      className={styles.deleteBtn}
                      title="Delete this comment"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Premium Confirm Delete Modal */}
      {commentToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirm Comment Soft Delete</h3>
            <p className={styles.modalWarning}>
              ⚠️ Are you sure you want to soft delete the comment by{" "}
              <strong>{commentToDelete.user?.name}</strong>?
            </p>
            {!commentToDelete.parentComment ? (
              <p className={styles.modalDangerNote}>
                Note: Since this is a <strong>top-level comment</strong>, soft-deleting it will also recursively soft-delete all associated nested replies. You can retrieve them later by restoring this comment.
              </p>
            ) : (
              <p className={styles.modalDangerNote} style={{ color: "#ff9800", background: "rgba(255, 152, 0, 0.08)", borderLeftColor: "#ff9800" }}>
                Note: Since this is a <strong>reply comment</strong>, soft-deleting it will only delete this specific reply. The top-level comment will remain active.
              </p>
            )}
            <blockquote className={styles.modalQuote}>
              "{commentToDelete.content}"
            </blockquote>
            <div className={styles.modalActions}>
              <button 
                disabled={deleteLoading} 
                onClick={() => setCommentToDelete(null)} 
                className={styles.modalCancelBtn}
              >
                Cancel
              </button>
              <button 
                disabled={deleteLoading} 
                onClick={handleConfirmDelete} 
                className={styles.modalConfirmBtn}
              >
                {deleteLoading ? "Soft Deleting..." : "Soft Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
