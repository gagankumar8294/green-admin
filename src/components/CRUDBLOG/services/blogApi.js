import { API_BASE_URL } from "@/config/api";

const BASE_URL = `${API_BASE_URL}/api/blogs`;

export const getBlogsApi = async () => {
  const res = await fetch(`${BASE_URL}?all=true`);

  if (!res.ok) {
    throw new Error("Failed to fetch blogs");
  }

  return await res.json();
};

export const createBlogApi = async (payload) => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to create blog");
  }

  return await res.json();
};

export const updateBlogApi = async (id, payload) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to update blog");
  }

  return await res.json();
};

export const deleteBlogApi = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete blog");
  }

  return await res.json();
};

export const getDeletedBlogsApi = async () => {
  const res = await fetch(`${BASE_URL}/deleted`);

  if (!res.ok) {
    throw new Error("Failed to fetch deleted blogs");
  }

  return await res.json();
};

export const restoreBlogApi = async (id) => {
  const res = await fetch(`${BASE_URL}/restore/${id}`, {
    method: "PUT",
  });

  if (!res.ok) {
    throw new Error("Failed to restore blog");
  }

  return await res.json();
};

export const permanentDeleteBlogApi = async (id) => {
  const res = await fetch(`${BASE_URL}/permanent/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to permanently delete blog");
  }

  return await res.json();
};

export const uploadImagesApi = async (files, category) => {
  const formData = new FormData();

  Array.from(files).forEach((file) => {
    formData.append("images", file);
  });

  formData.append("category", category || "general");

  const res = await fetch(`${API_BASE_URL}/api/blog-upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Image upload failed");
  }

  return await res.json();
};