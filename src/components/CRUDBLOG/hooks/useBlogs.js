"use client";

import { useEffect, useRef, useState } from "react";

import {
  createBlogApi,
  deleteBlogApi,
  getBlogsApi,
  updateBlogApi,
  getDeletedBlogsApi,
  restoreBlogApi,
  permanentDeleteBlogApi,
} from "../services/blogApi";

export const useBlogs = () => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState([]);
  const [sections, setSections] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [deletedBlogs, setDeletedBlogs] = useState([]);
  const [status, setStatus] = useState("draft");

  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const titleRef = useRef(null);

  useEffect(() => {
    fetchBlogs();
    fetchDeletedBlogs();
    titleRef.current?.focus();
  }, []);

  const fetchBlogs = async () => {
    try {
      const data = await getBlogsApi();

      setBlogs(Array.isArray(data) ? data : data.blogs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeletedBlogs = async () => {
    try {
      const data = await getDeletedBlogsApi();

      setDeletedBlogs(Array.isArray(data) ? data : data.blogs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const generateSlug = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  const addSection = (type) => {
    if (!type) return;

    setSections((prev) => [
      ...prev,
      {
        type,
        value: "",
        alt: "",
        linkText: "",
        public_id: "",
      },
    ]);
  };

  const updateSection = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const removeSection = (index) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEdit = (blog) => {
    setIsEditing(true);

    setSelectedId(blog._id);
    setTitle(blog.title);
    setSlug(blog.slug);
    setCategory(Array.isArray(blog.category) ? blog.category : (blog.category ? [blog.category] : []));
    setSections(blog.sections);
    setStatus(blog.status || "published");

    titleRef.current?.focus();
  };

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setCategory([]);
    setSections([]);
    setStatus("draft");
    setIsEditing(false);
    setSelectedId(null);
  };

  const deleteBlog = async (id) => {
    try {
      await deleteBlogApi(id);
      fetchBlogs();
      fetchDeletedBlogs();
    } catch (err) {
      console.error(err);
    }
  };

  const restoreBlog = async (id) => {
    try {
      await restoreBlogApi(id);
      fetchBlogs();
      fetchDeletedBlogs();
    } catch (err) {
      console.error(err);
    }
  };

  const permanentDeleteBlog = async (id) => {
    try {
      await permanentDeleteBlogApi(id);
      fetchDeletedBlogs();
    } catch (err) {
      console.error(err);
    }
  };

  const submitBlog = async (targetStatus) => {
    const finalStatus = targetStatus || status || "draft";

    if (!title || !category || (Array.isArray(category) && category.length === 0)) {
      alert("Title and category are required");
      return;
    }

    // H1 validation
    const hasH1 = sections.some((s) => s.type === "h1");
    if (!hasH1) {
      alert("At least one H1 section is required");
      return;
    }

    // Image validation
    const invalidImage = sections.some(
      (s) => s.type === "image" && (!s.value || !s.alt)
    );
    if (invalidImage) {
      alert("All images must have URL and Alt text");
      return;
    }

    const payload = {
      title,
      slug: slug || generateSlug(title),
      category,
      sections: sections.filter((s) => s.value || s.type === "link"),
      status: finalStatus,
    };

    try {
      if (isEditing) {
        await updateBlogApi(selectedId, payload);
      } else {
        await createBlogApi(payload);
      }

      resetForm();
      fetchBlogs();
    } catch (err) {
      console.error(err);
      alert("Error saving blog. Check console.");
    }
  };

  return {
    title,
    setTitle,

    slug,
    setSlug,

    category,
    setCategory,

    sections,
    setSections,

    status,
    setStatus,

    blogs,
    deletedBlogs,

    isEditing,

    titleRef,

    addSection,
    updateSection,
    removeSection,

    handleEdit,
    deleteBlog,
    restoreBlog,
    permanentDeleteBlog,
    fetchDeletedBlogs,

    submitBlog,

    generateSlug,
  };
};