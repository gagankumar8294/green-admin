"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./Blogs.module.css";
import { API_BASE_URL } from "@/config/api";
import BlogForm from "../../CRUDBLOG/components/BlogForm";
import { useBlogs } from "../../CRUDBLOG/hooks/useBlogs";

const CATEGORIES = [
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
  "soil-and-fertilizers",
];

export default function AddBlogs() {
  const blog = useBlogs();

  const {
    title,
    setTitle,
    slug,
    setSlug,
    category,
    setCategory,
    sections,
    setSections,
    isEditing,
    titleRef,
    addSection,
    updateSection,
    removeSection,
    generateSlug,
    submitBlog,
  } = blog;

  const uploadImages = async (files) => {
    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append("images", file);
    });

    formData.append("category", (Array.isArray(category) && category.length > 0 ? category[0] : "general"));

    const res = await fetch(
      `${API_BASE_URL}/api/blog-upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error("Image upload failed");
    }

    return await res.json();
  };

  const moveSectionUp = (index) => {
    if (index === 0) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setSections(updated);
  };

  const moveSectionDown = (index) => {
    if (index === sections.length - 1) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setSections(updated);
  };

  return (
    <section className={styles.blogs_Section}>
      <h2 className={styles.heading}>
        {isEditing ? "Edit Blog" : "Add Blog"}
      </h2>

      <form onSubmit={(e) => e.preventDefault()}>
        <input
          ref={titleRef}
          placeholder="Blog Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSlug(generateSlug(e.target.value));
          }}
          required
        />

        <input
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />

        <div className={styles.catBox}>
          {CATEGORIES.map((c) => {
            const isChecked = Array.isArray(category) && category.includes(c);
            return (
              <label key={c} className={`${styles.catItem} ${isChecked ? styles.catItemActive : ""}`}>
                <input
                  type="checkbox"
                  className={styles.catCheckbox}
                  checked={isChecked}
                  onChange={() => {
                    if (isChecked) {
                      setCategory(category.filter((item) => item !== c));
                    } else {
                      setCategory([...category, c]);
                    }
                  }}
                />
                <span className={styles.catName}>{c.replace("-", " ")}</span>
              </label>
            );
          })}
        </div>

        {/* Sections */}
        {sections.map((sec, i) => (
          <div key={i} className={styles.sectionBox}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTypeLabel}>{sec.type.toUpperCase()}</span>

              <div className={styles.sectionActions}>
                <button
                  type="button"
                  className={styles.moveBtn}
                  onClick={() => moveSectionUp(i)}
                  disabled={i === 0}
                  title="Move Up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className={styles.moveBtn}
                  onClick={() => moveSectionDown(i)}
                  disabled={i === sections.length - 1}
                  title="Move Down"
                >
                  ▼
                </button>
                <button
                  type="button"
                  className={styles.removeSectionBtn}
                  onClick={() => removeSection(i)}
                >
                  Remove
                </button>
              </div>
            </div>
            {sec.type !== "link" && (
              <textarea
                className={styles.fullWidthTextarea}
                placeholder={sec.type.toUpperCase()}
                value={sec.value}
                onChange={(e) => updateSection(i, "value", e.target.value)}
                required={sec.type === "h1"} // H1 mandatory
              />
            )}

            {/* {sec.type === "image" && (
  <>
    <input
      type="file"
      accept="image/*"
      onChange={async (e) => {
        try {
          const uploaded = await uploadImages(e.target.files);

          if (uploaded?.length > 0) {
            updateSection(i, "value", uploaded[0].url);
            updateSection(i, "public_id", uploaded[0].public_id);
          }
        } catch (err) {
          console.error(err);
          alert("Image upload failed");
        }
      }}
    />

    {sec.value && (
      <img
        src={sec.value}
        alt="preview"
        style={{
          width: "120px",
          marginTop: "10px",
          borderRadius: "8px",
        }}
      />
    )}

    <input
      placeholder="Image Alt Text"
      value={sec.alt}
      onChange={(e) => updateSection(i, "alt", e.target.value)}
      required
    />
  </>
)} */}
{sec.type === "image" && (
  <>
    <input
      type="file"
      accept="image/*"
      onChange={async (e) => {
        try {
          const uploaded = await uploadImages(e.target.files);

          if (uploaded?.length > 0) {
            updateSection(i, "value", uploaded[0].url);
            updateSection(i, "public_id", uploaded[0].public_id);
          }
        } catch (err) {
          console.error(err);
          alert("Image upload failed");
        }
      }}
    />

    {sec.value && (
      <div className={styles.imagePreviewBox}>
        <img
          src={sec.value}
          alt="preview"
          style={{
            width: "120px",
            marginTop: "10px",
            borderRadius: "8px",
          }}
        />
        <input
      className={styles.fullWidthTextarea}
      placeholder="Image Alt Text"
      value={sec.alt}
      onChange={(e) => updateSection(i, "alt", e.target.value)}
      required={!!sec.value}
    />

        <button
          type="button"
          className={styles.removeImageBtn}
          onClick={() => {
            updateSection(i, "value", "");
            updateSection(i, "public_id", "");
          }}
        >
          Remove Image
        </button>
      </div>
    )}
  </>
)}

            {sec.type === "link" && (
              <div className={styles.linkRow}>
              <>
                <input
                  className={styles.fullWidthTextarea}
                  placeholder="Link Text"
                  value={sec.linkText}
                  onChange={(e) => updateSection(i, "linkText", e.target.value)}
                />
                <input
                  className={styles.fullWidthTextarea}
                  placeholder="URL"
                  value={sec.value}
                  onChange={(e) => updateSection(i, "value", e.target.value)}
                />
              </>
              </div>
            )}
          </div>
        ))}

        <div className={styles.quickAddContainer}>
          <span className={styles.quickAddLabel}>Quick Add Section:</span>
          <div className={styles.quickAddButtons}>
            <button
              type="button"
              className={styles.quickAddBtn}
              onClick={() => addSection("h1")}
            >
              + H1
            </button>
            <button
              type="button"
              className={styles.quickAddBtn}
              onClick={() => addSection("h2")}
            >
              + H2
            </button>
            <button
              type="button"
              className={styles.quickAddBtn}
              onClick={() => addSection("paragraph")}
            >
              + Paragraph
            </button>
            <button
              type="button"
              className={styles.quickAddBtn}
              onClick={() => addSection("image")}
            >
              + Image
            </button>
            <button
              type="button"
              className={styles.quickAddBtn}
              onClick={() => addSection("link")}
            >
              + Link
            </button>
          </div>
        </div>

        <div className={styles.dividerRow}>
          <span>or use dropdown</span>
        </div>

        <select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              addSection(e.target.value);
            }
          }}
        >
          <option value="" disabled>Choose section type...</option>
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="paragraph">Paragraph</option>
          <option value="image">Image</option>
          <option value="link">Link</option>
        </select>

        <div className={styles.actionButtonsRow}>
          <button
            type="button"
            className={styles.draftBtn}
            onClick={() => submitBlog("draft")}
          >
            {isEditing ? "Save Draft" : "Save as Draft"}
          </button>
          
          <button
            type="button"
            className={styles.publishBtn}
            onClick={() => submitBlog("published")}
          >
            {isEditing ? "Update & Publish" : "Publish Blog"}
          </button>
        </div>
      </form>

      <hr className={styles.divider} />

      <h2>Blogs</h2>
      {/* <div className={styles.blogList}>
        {blogs.map((b) => (
          <div key={b._id} className={styles.blogCard}>
            <h3>{b.sections.find((s) => s.type === "h1")?.value}</h3>
            <div className={styles.blogButtons}>
              <button className={styles.editBtn} onClick={() => handleEdit(b)}>
                Edit
              </button>
              <button className={styles.deleteBtn} onClick={() => deleteBlog(b._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div> */}
      <BlogForm {...blog} />
    </section>
  );
}
