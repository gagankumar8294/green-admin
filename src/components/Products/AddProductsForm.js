'use client';

import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import styles from "./AddProductForm.module.css";
import { API_BASE_URL } from "@/config/api";

const CATEGORY_OPTIONS = [
  "Uncategorized",
  "Air Plant",
  "Air Purifying Plants",
  "Assorted Succulents",
  "Beginner Friendly Plants",
  "Cacti & Succulents",
  "Cactus",
  "Climbers",
  "Creepers/Groundcovers",
  "Feng Shui Plants",
  "Flowering Plants",
  "Focal Plants",
  "Gifting Combos",
  "Hanging Plants",
  "Indoor Plants",
  "Low Maintenance Plants",
  "Office Desk Plants",
  "Online Plant Nursery",
  "Oxygen Plants",
  "Plant Combos",
  "Premium Ceramic Pots",
  "succulents",
  "Trees and Landscaping Services",
  "Vastu Plants",
];

export default function AddProductForm() {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    mainImage: "",
    mainImageAlt: "",
    subImages: [""],
    subImagesAlt: [""],
    description: "",
    quantity: "",
    weight: "",
    length: "",
    width: "",
  });

  const [features, setFeatures] = useState([""]);

  // ✅ FIXED — initialize categories state properly
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [errors, setErrors] = useState({});
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSub, setUploadingSub] = useState(false);

  // Unified Product Management State
  const [products, setProducts] = useState([]);
  const [deletedProducts, setDeletedProducts] = useState([]);
  const [viewMode, setViewMode] = useState("active"); // "active" or "deleted"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Modals / Popups state
  const [deletePopup, setDeletePopup] = useState({ open: false, productId: null, productName: "" });
  const [permanentDeletePopup, setPermanentDeletePopup] = useState({ open: false, productId: null, productName: "" });
  const [restorePopup, setRestorePopup] = useState({ open: false, productId: null, productName: "" });

  const formTopRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/products/list?all=true`);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const fetchDeletedProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/products/deleted`);
      setDeletedProducts(res.data.products || []);
    } catch (err) {
      console.error("Error fetching deleted products:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchDeletedProducts();
  }, []);

  const handleEdit = (p) => {
    setIsEditing(true);
    setEditId(p._id);
    
    const d = p.dimension || p.dimensions || {};
    setFormData({
      name: p.name || "",
      price: p.price !== undefined ? String(p.price) : "",
      mainImage: p.mainImage || "",
      mainImageAlt: p.mainImageAlt || "",
      subImages: p.subImages && p.subImages.length > 0 ? [...p.subImages] : [""],
      subImagesAlt: p.subImagesAlt && p.subImagesAlt.length > 0 ? [...p.subImagesAlt] : [""],
      description: p.description || "",
      quantity: p.quantity !== undefined ? String(p.quantity) : "",
      weight: p.weight || "",
      length: d.length || "",
      width: d.width || "",
    });

    setFeatures(p.features && p.features.length > 0 ? [...p.features] : [""]);
    setSelectedCategories(p.categories || []);
    setErrors({});
    
    // Scroll to the top of the form smoothly
    formTopRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({
      name: "",
      price: "",
      mainImage: "",
      mainImageAlt: "",
      subImages: [""],
      subImagesAlt: [""],
      description: "",
      quantity: "",
      weight: "",
      length: "",
      width: "",
    });
    setSelectedCategories([]);
    setFeatures([""]);
    setErrors({});
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("images", file);

    const res = await axios.post(`${API_BASE_URL}/api/products/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (res.data && res.data.length > 0) {
      return res.data[0].url;
    }
    throw new Error("No image URL returned");
  };

  const uploadMultipleImages = async (files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("images", file);
    });

    const res = await axios.post(`${API_BASE_URL}/api/products/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (res.data && res.data.length > 0) {
      return res.data.map(item => item.url);
    }
    throw new Error("No image URLs returned");
  };

  // Validate inputs
  const validate = () => {
    let err = {};

    if (!formData.name.trim()) err.name = "Product name is required";
    if (!formData.price || isNaN(formData.price)) err.price = "Valid price required";
    if (!formData.mainImage.trim()) err.mainImage = "Main image URL required";
    if (!formData.description.trim()) err.description = "Description required";
    if (!formData.quantity || isNaN(formData.quantity)) err.quantity = "Valid quantity required";
    if (!formData.weight.trim()) err.weight = "Weight required";
    if (!formData.length.trim()) err.length = "Length required";
    if (!formData.width.trim()) err.width = "Width required";
    if (selectedCategories.length === 0) err.categories = "Please select at least 1 category";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubImageChange = (index, value) => {
    const updated = [...formData.subImages];
    updated[index] = value;
    setFormData({ ...formData, subImages: updated });
  };

  const handleSubImageAltChange = (index, value) => {
    const updated = [...(formData.subImagesAlt || [])];
    updated[index] = value;
    setFormData({ ...formData, subImagesAlt: updated });
  };

  const addSubImageField = () => {
    setFormData({
      ...formData,
      subImages: [...formData.subImages, ""],
      subImagesAlt: [...(formData.subImagesAlt || []), ""]
    });
  };

  // Category select handler
  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleFormSubmit = async (status) => {
    if (!validate()) return;

    const payload = {
      name: formData.name,
      price: Number(formData.price),
      mainImage: formData.mainImage,
      mainImageAlt: formData.mainImageAlt,
      subImages: formData.subImages.filter((img) => img.trim() !== ""),
      subImagesAlt: (formData.subImagesAlt || []).filter((_, idx) => formData.subImages[idx]?.trim() !== ""),
      description: formData.description,
      quantity: Number(formData.quantity),
      weight: formData.weight,
      dimension: {
        length: formData.length,
        width: formData.width,
      },
      categories: selectedCategories, // ✅ BACKEND-READY
      features: features.filter((f) => f.trim() !== ""),
      status,
    };

    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/api/products/update/${editId}`, payload);
        alert(`Product updated successfully!`);
      } else {
        await axios.post(`${API_BASE_URL}/api/products/add`, payload);
        alert(`Product ${status === "draft" ? "saved as draft" : "published"} successfully!`);
      }

      // Reset form
      cancelEdit();
      fetchProducts();
      fetchDeletedProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product");
    }
  };

  const handleSoftDelete = async () => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/products/${deletePopup.productId}`);
      if (res.data && res.data.success) {
        fetchProducts();
        fetchDeletedProducts();
      } else {
        alert("Failed to move to trash");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting product");
    } finally {
      setDeletePopup({ open: false, productId: null, productName: "" });
    }
  };

  const handleRestore = async () => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/products/restore/${restorePopup.productId}`);
      if (res.data && res.data.success) {
        fetchProducts();
        fetchDeletedProducts();
      } else {
        alert("Failed to restore product");
      }
    } catch (err) {
      console.error(err);
      alert("Error restoring product");
    } finally {
      setRestorePopup({ open: false, productId: null, productName: "" });
    }
  };

  const handlePermanentDelete = async () => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/products/permanent/${permanentDeletePopup.productId}`);
      if (res.data && res.data.success) {
        fetchDeletedProducts();
      } else {
        alert("Failed to permanently delete product");
      }
    } catch (err) {
      console.error(err);
      alert("Error permanently deleting product");
    } finally {
      setPermanentDeletePopup({ open: false, productId: null, productName: "" });
    }
  };

  const filteredProducts = useMemo(() => {
    const list = viewMode === "active" ? products : deletedProducts;
    return list.filter((p) => {
      const nameMatch = p.name ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      const descMatch = p.description ? p.description.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      const matchesSearch = searchQuery === "" || nameMatch || descMatch;
      
      const matchesCategory =
        selectedCategory === "All" ||
        (p.categories && p.categories.includes(selectedCategory));

      return matchesSearch && matchesCategory;
    });
  }, [products, deletedProducts, viewMode, searchQuery, selectedCategory]);

  return (
    <div ref={formTopRef} style={{ width: "100%", scrollMarginTop: "20px" }}>
      <form className={styles.formContainer} onSubmit={(e) => e.preventDefault()}>
        <div className={styles.headerContainer}>
          <h2 className={styles.title}>
            {isEditing ? `✏️ Edit Product: ${formData.name}` : "🌱 Add New Product"}
          </h2>
          <p className={styles.subtitle}>
            {isEditing
              ? "Modify the fields below to update the product in your store."
              : "Fill in the details below to add a new plant or accessory to your store inventory."}
          </p>
        </div>

      {/* Section 1: Basic Information */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionHeader}>📦 Basic Information</h3>
        
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Product Name</label>
          <input className={styles.input} name="name" placeholder="E.g., Snake Plant" value={formData.name} onChange={handleChange} />
          {errors.name && <p className={styles.errorText}>{errors.name}</p>}
        </div>

        <div className={styles.gridTwoCols}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Price (₹)</label>
            <input className={styles.input} name="price" placeholder="E.g., 299" value={formData.price} onChange={handleChange} />
            {errors.price && <p className={styles.errorText}>{errors.price}</p>}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Quantity in Stock</label>
            <input className={styles.input} name="quantity" placeholder="E.g., 50" value={formData.quantity} onChange={handleChange} />
            {errors.quantity && <p className={styles.errorText}>{errors.quantity}</p>}
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Product Description</label>
          <textarea className={styles.textarea} name="description" placeholder="Describe plant care, sun needs, soil type, etc..." value={formData.description} onChange={handleChange} />
          {errors.description && <p className={styles.errorText}>{errors.description}</p>}
        </div>
      </div>

      {/* Section 2: Product Images */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionHeader}>🖼 Product Images</h3>
        
        {/* Main Image Selection */}
        <div className={styles.imageFieldContainer}>
          <label className={styles.fieldLabel}>Main Image URL</label>
          <input className={styles.input} name="mainImage" placeholder="Main Image URL" value={formData.mainImage} onChange={handleChange} />
          <input className={styles.input} name="mainImageAlt" placeholder="Main Image Alt Text (for SEO)" value={formData.mainImageAlt} onChange={handleChange} style={{ marginTop: "6px" }} />
          <div className={styles.uploadBtnContainer}>
            <label className={styles.fileInputLabel}>
              {uploadingMain ? "Uploading..." : "📁 Upload Main Image"}
              <input
                type="file"
                accept="image/*"
                className={styles.fileInput}
                disabled={uploadingMain}
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  try {
                    setUploadingMain(true);
                    const url = await uploadImage(file);
                    setFormData(prev => ({ ...prev, mainImage: url }));
                  } catch (err) {
                    console.error(err);
                    alert("Main image upload failed: " + err.message);
                  } finally {
                    setUploadingMain(false);
                  }
                }}
              />
            </label>
          </div>
          {formData.mainImage && (
            <div className={styles.imagePreviewContainer}>
              <img src={formData.mainImage} alt="Main Image Preview" className={styles.imagePreview} />
              <button
                type="button"
                className={styles.removeImageBtn}
                onClick={() => setFormData(prev => ({ ...prev, mainImage: "" }))}
              >
                Remove
              </button>
            </div>
          )}
          {errors.mainImage && <p className={styles.errorText}>{errors.mainImage}</p>}
        </div>

        {/* Sub Images Selection */}
        <div className={styles.imageFieldContainer}>
          <div className={styles.subImagesTitleRow}>
            <h4 className={styles.subImagesTitle}>Sub Images</h4>
            <label className={styles.fileInputLabel}>
              {uploadingSub ? "Uploading..." : "📁 Upload Multiple Sub Images"}
              <input
                type="file"
                accept="image/*"
                multiple
                className={styles.fileInput}
                disabled={uploadingSub}
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  try {
                    setUploadingSub(true);
                    const urls = await uploadMultipleImages(files);
                    setFormData(prev => {
                      const existing = prev.subImages.filter(img => img.trim() !== "");
                      const existingAlt = (prev.subImagesAlt || []).filter((_, idx) => prev.subImages[idx]?.trim() !== "");
                      const newAlts = new Array(urls.length).fill("");
                      return {
                        ...prev,
                        subImages: [...existing, ...urls, ""],
                        subImagesAlt: [...existingAlt, ...newAlts, ""]
                      };
                    });
                  } catch (err) {
                    console.error(err);
                    alert("Sub images upload failed: " + err.message);
                  } finally {
                    setUploadingSub(false);
                  }
                }}
              />
            </label>
          </div>

          {formData.subImages.map((img, index) => (
            <div key={index} style={{ marginBottom: "12px" }}>
              <div className={styles.subImageInputRow}>
                <input
                  className={styles.input}
                  placeholder={`Sub Image URL ${index + 1}`}
                  value={img}
                  onChange={(e) => handleSubImageChange(index, e.target.value)}
                />
                {img.trim() && (
                  <button
                    type="button"
                    className={styles.removeSubImageRowBtn}
                    onClick={() => {
                      const updated = [...formData.subImages];
                      updated.splice(index, 1);
                      const updatedAlt = [...(formData.subImagesAlt || [])];
                      updatedAlt.splice(index, 1);
                      setFormData({ ...formData, subImages: updated, subImagesAlt: updatedAlt });
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <input
                className={styles.input}
                placeholder={`Sub Image Alt Text ${index + 1} (for SEO)`}
                value={(formData.subImagesAlt && formData.subImagesAlt[index]) || ""}
                onChange={(e) => handleSubImageAltChange(index, e.target.value)}
                style={{ marginTop: "4px", fontSize: "14px" }}
              />
            </div>
          ))}

          <button type="button" className={styles.subImageBtn} onClick={addSubImageField}>
            + Add More Image Fields
          </button>

          {formData.subImages.filter(img => img.trim() !== "").length > 0 && (
            <div className={styles.subImagesGrid}>
              {formData.subImages.filter(img => img.trim() !== "").map((img, index) => (
                <div key={index} className={styles.subImagePreviewCard}>
                  <img src={img} alt={`Sub Preview ${index + 1}`} className={styles.subImagePreview} />
                  <button
                    type="button"
                    className={styles.removeSubImageCardBtn}
                    onClick={() => {
                      const updated = formData.subImages.filter(val => val !== img);
                      setFormData({ ...formData, subImages: updated.length > 0 ? updated : [""] });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Specifications & Features */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionHeader}>📏 Specifications & Highlights</h3>
        
        <div className={styles.gridThreeCols}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Weight (e.g. 200g, 2kg)</label>
            <input className={styles.input} name="weight" placeholder="Weight" value={formData.weight} onChange={handleChange} />
            {errors.weight && <p className={styles.errorText}>{errors.weight}</p>}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Length (cm)</label>
            <input className={styles.input} name="length" placeholder="Length" value={formData.length} onChange={handleChange} />
            {errors.length && <p className={styles.errorText}>{errors.length}</p>}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Width (cm)</label>
            <input className={styles.input} name="width" placeholder="Width" value={formData.width} onChange={handleChange} />
            {errors.width && <p className={styles.errorText}>{errors.width}</p>}
          </div>
        </div>

        <div className={styles.featuresSection}>
          <label className={styles.inputLabel}>Product Highlights / Features</label>
          {features.map((f, i) => (
            <div key={i} className={styles.featureRow}>
              <input
                className={styles.input}
                value={f}
                placeholder={`Highlight Point ${i + 1} (e.g. Low light friendly)`}
                onChange={(e) => {
                  const copy = [...features];
                  copy[i] = e.target.value;
                  setFeatures(copy);
                }}
              />
              {features.length > 1 && (
                <button
                  type="button"
                  className={styles.removeFeatureBtn}
                  onClick={() => {
                    const copy = features.filter((_, idx) => idx !== i);
                    setFeatures(copy);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button type="button" className={styles.addFeatureBtn} onClick={() => setFeatures([...features, ""])}>
            + Add Feature Point
          </button>
        </div>
      </div>

      {/* Section 4: Categories */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionHeader}>🏷 Select Categories</h3>
        <div className={styles.catBox}>
          {CATEGORY_OPTIONS.map((cat) => (
            <label key={cat} className={`${styles.catItem} ${selectedCategories.includes(cat) ? styles.catItemActive : ""}`}>
              <input
                type="checkbox"
                className={styles.catCheckbox}
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
              <span className={styles.catName}>{cat}</span>
            </label>
          ))}
        </div>
        {errors.categories && <p className={styles.errorText}>{errors.categories}</p>}
      </div>

      <div className={styles.actionButtonsRow}>
        {isEditing && (
          <button
            type="button"
            className={styles.cancelEditBtn}
            onClick={cancelEdit}
          >
            Cancel Edit
          </button>
        )}
        
        <button
          type="button"
          className={styles.draftBtn}
          onClick={() => handleFormSubmit("draft")}
        >
          {isEditing ? "Save Draft" : "Save as Draft"}
        </button>
        
        <button
          type="button"
          className={styles.publishBtn}
          onClick={() => handleFormSubmit("public")}
        >
          {isEditing ? "Update & Publish" : "Publish Product"}
        </button>
      </div>
    </form>

    <hr className={styles.divider} />

    {/* Unified Product List */}
    <div className={styles.listSection}>
      <div className={styles.listHeaderRow}>
        <h2 className={styles.listTitle}>📦 Manage Products</h2>
        <div className={styles.tabButtonGroup}>
          <button
            onClick={() => setViewMode("active")}
            type="button"
            className={`${styles.tabBtn} ${viewMode === "active" ? styles.tabBtnActive : ""}`}
          >
            Active Products ({products.length})
          </button>
          <button
            onClick={() => setViewMode("deleted")}
            type="button"
            className={`${styles.tabBtn} ${viewMode === "deleted" ? styles.tabBtnDeletedActive : ""}`}
          >
            Deleted (Trash) ({deletedProducts.length})
          </button>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className={styles.filterControls}>
        <input
          type="text"
          placeholder="Search products by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.categorySelect}
        >
          <option value="All">All Categories</option>
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <p className={styles.noResults}>No products found.</p>
      ) : (
        <div className={styles.productGrid}>
          {filteredProducts.map((p) => (
            <div key={p._id} className={styles.productCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardImageWrapper}>
                  <img
                    src={p.mainImage || "https://placehold.co/100"}
                    alt={p.mainImageAlt || p.name}
                    className={styles.cardImage}
                  />
                </div>
                <div className={styles.cardBadges}>
                  {viewMode === "active" && (
                    <span className={p.status === "draft" ? styles.badgeDraft : styles.badgePublished}>
                      {p.status === "draft" ? "Draft" : "Published"}
                    </span>
                  )}
                  <span className={p.inStock ? styles.badgeInStock : styles.badgeOutOfStock}>
                    {p.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
              </div>

              <div className={styles.cardContent}>
                <h3 className={styles.cardName}>{p.name}</h3>
                <div className={styles.cardMeta}>
                  <span className={styles.cardPrice}>₹{p.price}</span>
                  <span className={styles.cardQty}>Stock: {p.quantity}</span>
                </div>
                {p.categories && p.categories.length > 0 && (
                  <div className={styles.cardCategories}>
                    {p.categories.map((c) => (
                      <span key={c} className={styles.categoryTag}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                {viewMode === "active" ? (
                  <>
                    <button
                      className={styles.editBtn}
                      onClick={() => handleEdit(p)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => setDeletePopup({ open: true, productId: p._id, productName: p.name })}
                      type="button"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={styles.restoreBtn}
                      onClick={() => setRestorePopup({ open: true, productId: p._id, productName: p.name })}
                      type="button"
                    >
                      Restore
                    </button>
                    <button
                      className={styles.permanentDeleteBtn}
                      onClick={() => setPermanentDeletePopup({ open: true, productId: p._id, productName: p.name })}
                      type="button"
                    >
                      Permanent Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* CONFIRMATION POPUPS */}
    {deletePopup.open && (
      <div className={styles.popupOverlay} onClick={() => setDeletePopup({ open: false, productId: null, productName: "" })}>
        <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
          <h2>Move to Trash</h2>
          <p>
            Do you want to move:
            <span className={styles.highlightTitle}> "{deletePopup.productName}"</span> to trash?
          </p>
          <div className={styles.popupButtons}>
            <button
              className={styles.cancelBtn}
              onClick={() => setDeletePopup({ open: false, productId: null, productName: "" })}
            >
              No
            </button>
            <button
              className={styles.confirmDeleteBtn}
              onClick={handleSoftDelete}
            >
              Yes, Move to Trash
            </button>
          </div>
        </div>
      </div>
    )}

    {restorePopup.open && (
      <div className={styles.popupOverlay} onClick={() => setRestorePopup({ open: false, productId: null, productName: "" })}>
        <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
          <h2>Restore Product</h2>
          <p>
            Are you sure you want to restore:
            <span className={styles.highlightTitle}> "{restorePopup.productName}"</span>?
          </p>
          <div className={styles.popupButtons}>
            <button
              className={styles.cancelBtn}
              onClick={() => setRestorePopup({ open: false, productId: null, productName: "" })}
            >
              Cancel
            </button>
            <button
              className={styles.confirmRestoreBtn}
              onClick={handleRestore}
            >
              Yes, Restore
            </button>
          </div>
        </div>
      </div>
    )}

    {permanentDeletePopup.open && (
      <div className={styles.popupOverlay} onClick={() => setPermanentDeletePopup({ open: false, productId: null, productName: "" })}>
        <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
          <h2>Permanent Delete Product</h2>
          <p>
            Are you sure you want to permanently delete:
            <span className={styles.highlightTitle}> "{permanentDeletePopup.productName}"</span>?
            <br /><strong>This action cannot be undone.</strong>
          </p>
          <div className={styles.popupButtons}>
            <button
              className={styles.cancelBtn}
              onClick={() => setPermanentDeletePopup({ open: false, productId: null, productName: "" })}
            >
              Cancel
            </button>
            <button
              className={styles.confirmDeleteBtn}
              onClick={handlePermanentDelete}
            >
              Yes, Delete Permanently
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
