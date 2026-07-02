"use client";

import { useState, useMemo } from "react";
import { FiEdit, FiTrash2, FiRefreshCw } from "react-icons/fi";
import styles from "./Blogs.module.css";

const ALL_CATEGORIES = [
  "flower-crops",
  "landscape",
  "nutritional-values",
  "mysteries-of-flower",
  "plants",
  "landscaping",
  "gardening",
  "indoor-plants",
  "outdoor-plants",
  "plant-care",
  "soil-and-fertilizers"
];

export default function BlogForm({
  title,
  setTitle,
  slug,
  setSlug,
  category,
  setCategory,
  sections,
  blogs,
  isEditing,
  titleRef,
  addSection,
  updateSection,
  removeSection,
  handleEdit,
  deleteBlog,
  submitBlog,
  generateSlug,
  deletedBlogs,
  restoreBlog,
  permanentDeleteBlog,
}) {
  const [viewMode, setViewMode] = useState("active"); // "active" or "deleted"

  const [deletePopup, setDeletePopup] = useState({
    open: false,
    blogId: null,
    blogTitle: "",
  });

  const [permanentDeletePopup, setPermanentDeletePopup] = useState({
    open: false,
    blogId: null,
    blogTitle: "",
  });

  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  const CATEGORIES = [
    "flower-crops",
    "landscape",
    "nutritional-values",
    "mysteries-of-flower",
  ];

  const openDeletePopup = (id, title) => {
    setDeletePopup({
      open: true,
      blogId: id,
      blogTitle: title,
    });
  };

  const closeDeletePopup = () => {
    setDeletePopup({
      open: false,
      blogId: null,
      blogTitle: "",
    });
  };

  const confirmDelete = () => {
    deleteBlog(deletePopup.blogId);
    closeDeletePopup();
  };

  const openPermanentDeletePopup = (id, title) => {
    setPermanentDeletePopup({
      open: true,
      blogId: id,
      blogTitle: title,
    });
  };

  const closePermanentDeletePopup = () => {
    setPermanentDeletePopup({
      open: false,
      blogId: null,
      blogTitle: "",
    });
  };

  const confirmPermanentDelete = () => {
    permanentDeleteBlog(permanentDeletePopup.blogId);
    closePermanentDeletePopup();
  };

  const filteredBlogs = useMemo(() => {
    let result = viewMode === "active" ? (blogs || []) : (deletedBlogs || []);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.slug?.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "ALL") {
      result = result.filter((b) =>
        Array.isArray(b.category)
          ? b.category.includes(categoryFilter)
          : b.category === categoryFilter
      );
    }

    if (viewMode === "active" && statusFilter !== "ALL") {
      result = result.filter((b) => b.status === statusFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "oldest":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "title-asc":
          return (a.title || "").localeCompare(b.title || "");
        case "title-desc":
          return (b.title || "").localeCompare(a.title || "");
        default:
          return 0;
      }
    });

    return result;
  }, [blogs, deletedBlogs, viewMode, searchQuery, categoryFilter, statusFilter, sortBy]);

  return (
    <section className={styles.blogs_Section}>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setViewMode("active")}
          type="button"
          style={{
            padding: "8px 16px",
            backgroundColor: viewMode === "active" ? "#4caf50" : "#ddd",
            color: viewMode === "active" ? "#fff" : "#000",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Active Blogs
        </button>
        <button
          onClick={() => setViewMode("deleted")}
          type="button"
          style={{
            padding: "8px 16px",
            backgroundColor: viewMode === "deleted" ? "#f44336" : "#ddd",
            color: viewMode === "deleted" ? "#fff" : "#000",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Deleted Blogs (Trash)
        </button>
      </div>

      {/* Search and Filters */}
      <div className={styles.controlsRow}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search blogs by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.filterControl}>
            <label>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">All Categories</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace("-", " ")}
                </option>
              ))}
            </select>
          </div>

          {viewMode === "active" && (
            <div className={styles.filterControl}>
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.selectInput}
              >
                <option value="ALL">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          )}

          <div className={styles.filterControl}>
            <label>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.selectInput}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title-asc">Title: A-Z</option>
              <option value="title-desc">Title: Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {filteredBlogs?.length === 0 && (
        <p>No matching {viewMode} blogs found.</p>
      )}

      <div className={styles.blogList}>
        {filteredBlogs?.map((b) => (
          <div key={b._id} className={styles.blogCard}>
            <div className={styles.blogCardHeader}>
              <h3>{b.title}</h3>
              {viewMode === "active" && (
                <span className={b.status === "draft" ? styles.badgeDraft : styles.badgePublished}>
                  {b.status === "draft" ? "Draft" : "Published"}
                </span>
              )}
            </div>

            <div className={styles.blogButtons}>
              {viewMode === "active" ? (
                <>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleEdit(b)}
                    type="button"
                    title="Edit Blog"
                  >
                    <FiEdit size={14} /> Edit
                  </button>

                  <button
                    className={styles.deleteBtn}
                    onClick={() => openDeletePopup(b._id, b.title)}
                    type="button"
                    title="Move to Trash"
                  >
                    <FiTrash2 size={14} /> Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={styles.restoreBtn}
                    onClick={() => restoreBlog(b._id)}
                    type="button"
                    title="Restore Blog"
                  >
                    <FiRefreshCw size={14} /> Restore
                  </button>

                  <button
                    className={styles.permanentDeleteBtn}
                    onClick={() => openPermanentDeletePopup(b._id, b.title)}
                    type="button"
                    title="Permanently Delete Blog"
                  >
                    <FiTrash2 size={14} /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* DELETE POPUP */}
      {deletePopup.open && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupBox}>
            <h2>Move to Trash</h2>

            <p>
              Do you want to move:
              <span className={styles.blogTitle}>
                {" "}
                "{deletePopup.blogTitle}"
              </span>
              {" "}to trash?
            </p>

            <div className={styles.popupButtons}>
              <button
                className={styles.cancelBtn}
                onClick={closeDeletePopup}
              >
                No
              </button>

              <button
                className={styles.confirmDeleteBtn}
                onClick={confirmDelete}
              >
                Yes, Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE POPUP */}
      {permanentDeletePopup.open && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupBox}>
            <h2>Permanent Delete Blog</h2>

            <p>
              Are you sure you want to permanently delete:
              <span className={styles.blogTitle}>
                {" "}
                "{permanentDeletePopup.blogTitle}"
              </span>
              ? This action cannot be undone.
            </p>

            <div className={styles.popupButtons}>
              <button
                className={styles.cancelBtn}
                onClick={closePermanentDeletePopup}
              >
                Cancel
              </button>

              {/* <button
                className={styles.confirmDeleteBtn}
                onClick={confirmPermanentDelete}
              >
                Yes, Delete Permanently
              </button> */}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}