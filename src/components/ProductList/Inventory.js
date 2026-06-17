"use client";
import React, { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import styles from "../ProductList/Inventory.module.css";
import { API_BASE_URL } from "@/config/api";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [deletedProducts, setDeletedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("active"); // "active" or "deleted"
  const [editId, setEditId] = useState(null);

  // SEARCH, FILTER, SORT STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stockStatus, setStockStatus] = useState("All");
  const [sortBy, setSortBy] = useState("date-newest");

  // PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // PREVIEW MODAL STATE
  const [previewProduct, setPreviewProduct] = useState(null);

  // POPUP CONFIRMATION STATES
  const [deletePopup, setDeletePopup] = useState({
    open: false,
    productId: null,
    productName: "",
  });

  const [permanentDeletePopup, setPermanentDeletePopup] = useState({
    open: false,
    productId: null,
    productName: "",
  });

  const [restorePopup, setRestorePopup] = useState({
    open: false,
    productId: null,
    productName: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    weight: "",
    mainImage: "",
    subImages: [],
    categories: "",
    dimension: {
      length: "",
      width: "",
    },
    inStock: true,
    status: "public",
  });

  // FETCH PRODUCTS
  const fetchProducts = async () => {
    const res = await fetch(`${API_BASE_URL}/api/products/list?all=true`);
    const data = await res.json();
    setProducts(data.products || []);
  };

  // FETCH DELETED PRODUCTS
  const fetchDeletedProducts = async () => {
    const res = await fetch(`${API_BASE_URL}/api/products/deleted`);
    const data = await res.json();
    setDeletedProducts(data.products || []);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProducts(), fetchDeletedProducts()]).finally(() =>
      setLoading(false)
    );
  }, []);

  // EDIT
  const handleEdit = (p) => {
    setEditId(p._id);
    const d = p.dimension || p.dimensions || {};
    setFormData({
      name: p.name || "",
      description: p.description || "",
      price: p.price || "",
      quantity: p.quantity || "",
      weight: p.weight || "",
      mainImage: p.mainImage || "",
      subImages: p.subImages || [],
      categories: (p.categories || []).join(", "),
      dimension: {
        length: d.length || "",
        width: d.width || "",
      },
      inStock: p.inStock ?? true,
      status: p.status || "public",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDimensionChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      dimension: { ...prev.dimension, [name]: value },
    }));
  };

  // SUB IMAGES
  const addSubImage = () => {
    setFormData((p) => ({ ...p, subImages: [...p.subImages, ""] }));
  };

  const toggleInStock = () => {
    setFormData((prev) => ({
      ...prev,
      inStock: !prev.inStock,
    }));
  };

  const updateSubImage = (i, v) => {
    const updated = [...formData.subImages];
    updated[i] = v;
    setFormData((p) => ({ ...p, subImages: updated }));
  };

  const removeSubImage = (i) => {
    setFormData((p) => ({
      ...p,
      subImages: p.subImages.filter((_, idx) => idx !== i),
    }));
  };

  // SAVE
  const handleSave = async () => {
    await fetch(
      `${API_BASE_URL}/api/products/update/${editId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categories: formData.categories
            .split(",")
            .map((c) => c.trim()),
        }),
      }
    );

    setEditId(null);
    fetchProducts();
    fetchDeletedProducts();
  };

  // SOFT DELETE
  const triggerDelete = (id, name) => {
    setDeletePopup({ open: true, productId: id, productName: name });
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/products/${deletePopup.productId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        fetchProducts();
        fetchDeletedProducts();
      } else {
        alert(`Failed to move to trash: ${data.message || res.statusText}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setDeletePopup({ open: false, productId: null, productName: "" });
    }
  };

  // RESTORE
  const triggerRestore = (id, name) => {
    setRestorePopup({ open: true, productId: id, productName: name });
  };

  const confirmRestore = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/products/restore/${restorePopup.productId}`,
        { method: "PUT" }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        fetchProducts();
        fetchDeletedProducts();
      } else {
        alert(`Failed to restore product: ${data.message || res.statusText}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setRestorePopup({ open: false, productId: null, productName: "" });
    }
  };

  // PERMANENT DELETE
  const triggerPermanentDelete = (id, name) => {
    setPermanentDeletePopup({ open: true, productId: id, productName: name });
  };

  const confirmPermanentDelete = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/products/permanent/${permanentDeletePopup.productId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        fetchDeletedProducts();
      } else {
        alert(`Failed to permanently delete product: ${data.message || res.statusText}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setPermanentDeletePopup({
        open: false,
        productId: null,
        productName: "",
      });
    }
  };

  // EXTRACT ALL UNIQUE CATEGORIES
  const allCategories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      if (p.categories && Array.isArray(p.categories)) {
        p.categories.forEach((c) => {
          if (c && c.trim()) {
            cats.add(c.trim());
          }
        });
      }
    });
    return Array.from(cats).sort();
  }, [products]);

  const cleanMarkdown = (desc) => {
    if (!desc) return "";
    return desc
      .replace(/^```markdown\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  };

  // STRIP MARKDOWN FOR PREVIEW SNIPPET
  const stripMarkdownAndTruncate = (md, maxLength = 60) => {
    if (!md) return "";
    const clean = cleanMarkdown(md);
    let plain = clean
      .replace(/[#*`_~-]/g, "") // Remove common formatting characters
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Simplify link format
      .replace(/\s+/g, " ") // Normalize spaces
      .trim();
    if (plain.length <= maxLength) return plain;
    return plain.slice(0, maxLength) + "...";
  };

  // CLIENT-SIDE FILTERING & SORTING
  const filteredProducts = useMemo(() => {
    let result = viewMode === "active" ? [...products] : [...deletedProducts];

    // Search Query (Name / Description / Categories)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.categories && p.categories.some((c) => c.toLowerCase().includes(q)))
      );
    }

    // Category Filter
    if (selectedCategory !== "All") {
      result = result.filter(
        (p) =>
          p.categories &&
          p.categories.some((c) => c.trim() === selectedCategory)
      );
    }

    // Stock Status Filter
    if (stockStatus !== "All") {
      const isInstock = stockStatus === "inStock";
      result = result.filter((p) => (p.inStock ?? true) === isInstock);
    }

    // Sort Logic
    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "price-asc":
          return Number(a.price || 0) - Number(b.price || 0);
        case "price-desc":
          return Number(b.price || 0) - Number(a.price || 0);
        case "qty-asc":
          return Number(a.quantity || 0) - Number(b.quantity || 0);
        case "qty-desc":
          return Number(b.quantity || 0) - Number(a.quantity || 0);
        case "date-newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "date-oldest":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [products, deletedProducts, viewMode, searchQuery, selectedCategory, stockStatus, sortBy]);

  // PAGINATION CALCULATIONS
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, stockStatus, itemsPerPage]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 20px",
          gap: "20px",
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            border: "3px solid rgba(16,185,129,0.2)",
            borderTop: "3px solid #10b981",
            borderRadius: "50%",
            animation: "inv-spin 0.8s linear infinite",
          }} />
          <p style={{ color: "#6b7280", fontSize: "0.95rem", margin: 0 }}>Loading inventory...</p>
          <style>{`@keyframes inv-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 📑 TABS: ACTIVE vs TRASH */}
      <div className={styles.tabsHeader}>
        <button
          className={`${styles.tabBtn} ${viewMode === "active" ? styles.activeTab : ""}`}
          onClick={() => setViewMode("active")}
        >
          Active Products ({products.length})
        </button>
        <button
          className={`${styles.tabBtn} ${viewMode === "deleted" ? styles.activeTab : ""}`}
          onClick={() => setViewMode("deleted")}
        >
          Trash ({deletedProducts.length})
        </button>
      </div>

      {/* 🛠️ PREMIUM CONTROLS & FILTERING DASHBOARD */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <svg
            className={styles.searchIcon}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search products by name, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.filtersGroup}>
          <div className={styles.filterControl}>
            <label>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.selectInput}
            >
              <option value="All">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterControl}>
            <label>Stock Status</label>
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className={styles.selectInput}
            >
              <option value="All">All Statuses</option>
              <option value="inStock">In Stock</option>
              <option value="outOfStock">Out of Stock</option>
            </select>
          </div>

          <div className={styles.filterControl}>
            <label>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.selectInput}
            >
              <option value="date-newest">Date: Newest First</option>
              <option value="date-oldest">Date: Oldest First</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="qty-asc">Quantity: Low to High</option>
              <option value="qty-desc">Quantity: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 📊 RESULTS METRICS */}
      <div className={styles.metricsBar}>
        <div className={styles.metricsText}>
          Showing <strong>{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> -{" "}
          <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{" "}
          <strong>{totalItems}</strong> products found
          {selectedCategory !== "All" && (
            <span className={styles.activeFilterBadge}>
              Category: {selectedCategory}
            </span>
          )}
          {stockStatus !== "All" && (
            <span className={styles.activeFilterBadge}>
              Stock: {stockStatus === "inStock" ? "In Stock" : "Out of Stock"}
            </span>
          )}
        </div>

        <div className={styles.pageSizeSelector}>
          <label>Show</label>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className={styles.selectPageSize}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>per page</span>
        </div>
      </div>

      {/* 📦 DATA TABLE */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Qty</th>
              <th>In Stock</th>
              <th>Status</th>
              <th>Weight</th>
              <th>Categories</th>
              <th>Dimensions</th>
              <th>Dates</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map((p) =>
                editId === p._id ? (
                  <React.Fragment key={p._id}>
                    <tr className={styles.editRow}>
                      <td data-label="Image">
                        <img src={formData.mainImage} className={styles.image} alt={formData.name} />
                      </td>

                      <td data-label="Name">
                        <input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={styles.input}
                        />
                      </td>

                      <td data-label="Description">
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          className={styles.textarea}
                          placeholder="Markdown description here..."
                        />
                      </td>

                      <td data-label="Price">
                        <input
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          className={styles.input}
                        />
                      </td>

                      <td data-label="Qty">
                        <input
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleChange}
                          className={styles.input}
                        />
                      </td>

                      <td data-label="In Stock">
                        <div
                          className={`${styles.toggle} ${
                            formData.inStock ? styles.toggleOn : styles.toggleOff
                          }`}
                          onClick={toggleInStock}
                        >
                          <div className={styles.knob}></div>
                        </div>
                      </td>

                      <td data-label="Status">
                        <select
                          name="status"
                          value={formData.status || "public"}
                          onChange={handleChange}
                          className={styles.selectInput}
                        >
                          <option value="public">Public</option>
                          <option value="draft">Draft</option>
                        </select>
                      </td>

                      <td data-label="Weight">
                        <input
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          className={styles.input}
                        />
                      </td>

                      <td data-label="Categories">
                        <input
                          value={formData.categories}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              categories: e.target.value,
                            }))
                          }
                          placeholder="plant, indoor"
                          className={styles.input}
                        />
                      </td>

                      <td className={styles.dimensions} data-label="Dimensions">
                        <input
                          placeholder="L"
                          name="length"
                          value={formData.dimension.length}
                          onChange={handleDimensionChange}
                          className={styles.input}
                        />
                        <input
                          placeholder="W"
                          name="width"
                          value={formData.dimension.width}
                          onChange={handleDimensionChange}
                          className={styles.input}
                        />
                      </td>

                      <td className={styles.dates} data-label="Dates">
                        <small>Editing Mode</small>
                      </td>

                      <td data-label="Actions">
                        <button className={styles.saveBtn} onClick={handleSave}>
                          Save
                        </button>
                        <button
                          className={styles.cancelBtn}
                          onClick={() => setEditId(null)}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>

                    {/* SUB IMAGES EDITING ROW */}
                    <tr className={styles.editSubRow}>
                      <td colSpan="12" className={styles.subImagesRow} data-label="Sub Images">
                        <div className={styles.subImagesTitle}>Sub Images</div>
                        <div className={styles.subImagesList}>
                          {formData.subImages.map((img, i) => (
                            <div key={i} className={styles.subImageInput}>
                              <input
                                value={img}
                                onChange={(e) => updateSubImage(i, e.target.value)}
                                placeholder="Image URL"
                                className={styles.input}
                              />
                              <button onClick={() => removeSubImage(i)}>✕</button>
                            </div>
                          ))}
                        </div>
                        <button onClick={addSubImage} className={styles.addBtn}>
                          + Add Sub Image
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                ) : (
                  <tr key={p._id}>
                    <td data-label="Image">
                      <img src={p.mainImage} className={styles.image} alt={p.name} />
                    </td>
                    <td data-label="Name" className={styles.productName}>
                      {p.name}
                    </td>
                    <td data-label="Description" className={styles.productDesc}>
                      <div className={styles.descriptionText}>
                        {stripMarkdownAndTruncate(p.description, 65)}
                      </div>
                      {p.description && p.description.length > 65 && (
                        <button
                          className={styles.readMoreBadge}
                          onClick={() => setPreviewProduct(p)}
                          title="View Fully Rendered Markdown Description"
                        >
                          View Markdown
                        </button>
                      )}
                    </td>
                    <td data-label="Price" className={styles.productPrice}>
                      ₹{p.price}
                    </td>
                    <td data-label="Qty">{p.quantity}</td>
                    <td data-label="In Stock">
                      <span
                        className={
                          p.inStock ? styles.inStockBadge : styles.outOfStockBadge
                        }
                      >
                        {p.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>

                    <td data-label="Status">
                      <span
                        className={
                          p.status === "draft" ? styles.badgeDraft : styles.badgePublished
                        }
                      >
                        {p.status === "draft" ? "Draft" : "Public"}
                      </span>
                    </td>

                    <td data-label="Weight">{p.weight}kg</td>
                    <td data-label="Categories">
                      <div className={styles.categoriesTags}>
                        {(p.categories || []).map((cat) => (
                          <span key={cat} className={styles.categoryTag}>
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td data-label="Dimensions" className={styles.dimensionsText}>
                      {p.dimension?.length || p.dimensions?.length ? (
                        `${p.dimension?.length || p.dimensions?.length}×${p.dimension?.width || p.dimensions?.width} cm`
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td data-label="Dates" className={styles.dates}>
                      <small>
                        Created: {new Date(p.createdAt).toLocaleDateString()}
                      </small>
                      <small>
                        Updated: {new Date(p.updatedAt).toLocaleDateString()}
                      </small>
                    </td>
                    <td data-label="Actions">
                      {viewMode === "active" ? (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className={styles.editBtn}
                            onClick={() => handleEdit(p)}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.trashBtn}
                            onClick={() => triggerDelete(p._id, p.name)}
                          >
                            Move to Trash
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className={styles.restoreBtn}
                            onClick={() => triggerRestore(p._id, p.name)}
                          >
                            Restore
                          </button>
                          <button
                            className={styles.permanentDeleteBtn}
                            onClick={() => triggerPermanentDelete(p._id, p.name)}
                          >
                            Delete Permanently
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              )
            ) : (
              <tr>
                <td colSpan="12" className={styles.noResultsCell}>
                  <div className={styles.noResults}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    <p>No products match your filters</p>
                    <button
                      className={styles.resetFiltersBtn}
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("All");
                        setStockStatus("All");
                      }}
                    >
                      Reset All Filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🎛️ PAGINATION FOOTER */}
      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={styles.pageBtn}
          >
            « First
          </button>
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={styles.pageBtn}
          >
            ‹ Prev
          </button>

          <div className={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show first, last, current, and pages around current
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                );
              })
              .map((page, index, arr) => {
                // Add ellipsis
                const showEllipsis = index > 0 && page - arr[index - 1] > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className={styles.ellipsis}>...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`${styles.pageNumberBtn} ${
                        currentPage === page ? styles.activePage : ""
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={styles.pageBtn}
          >
            Next ›
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className={styles.pageBtn}
          >
            Last »
          </button>
        </div>
      )}

      {/* 👁️ PREMIUM GLASSMORPHIC MARKDOWN DESCRIPTION MODAL */}
      {previewProduct && (
        <div
          className={styles.modalOverlay}
          onClick={() => setPreviewProduct(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{previewProduct.name}</h3>
              <button
                className={styles.modalCloseIcon}
                onClick={() => setPreviewProduct(null)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.markdownContent}>
                <ReactMarkdown>
                  {cleanMarkdown(previewProduct.description)}
                </ReactMarkdown>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setPreviewProduct(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ MOVE TO TRASH POPUP */}
      {deletePopup.open && (
        <div
          className={styles.popupOverlay}
          onClick={() =>
            setDeletePopup({ open: false, productId: null, productName: "" })
          }
        >
          <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <h2>Move to Trash</h2>
            <p>
              Are you sure you want to move{" "}
              <span className={styles.productHighlight}>
                "{deletePopup.productName}"
              </span>{" "}
              to Trash?
            </p>
            <div className={styles.popupButtons}>
              <button
                className={styles.cancelBtn}
                onClick={() =>
                  setDeletePopup({
                    open: false,
                    productId: null,
                    productName: "",
                  })
                }
              >
                Cancel
              </button>
              <button className={styles.confirmBtn} onClick={confirmDelete}>
                Yes, Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔄 RESTORE PRODUCT POPUP */}
      {restorePopup.open && (
        <div
          className={styles.popupOverlay}
          onClick={() =>
            setRestorePopup({ open: false, productId: null, productName: "" })
          }
        >
          <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <h2>Restore Product</h2>
            <p>
              Are you sure you want to restore{" "}
              <span className={styles.productHighlight}>
                "{restorePopup.productName}"
              </span>
              ?
            </p>
            <div className={styles.popupButtons}>
              <button
                className={styles.cancelBtn}
                onClick={() =>
                  setRestorePopup({
                    open: false,
                    productId: null,
                    productName: "",
                  })
                }
              >
                Cancel
              </button>
              <button
                className={styles.confirmRestoreBtn}
                onClick={confirmRestore}
              >
                Yes, Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 PERMANENT DELETE POPUP */}
      {permanentDeletePopup.open && (
        <div
          className={styles.popupOverlay}
          onClick={() =>
            setPermanentDeletePopup({
              open: false,
              productId: null,
              productName: "",
            })
          }
        >
          <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <h2>Delete Permanently</h2>
            <p>
              Are you sure you want to permanently delete{" "}
              <span className={styles.productHighlight}>
                "{permanentDeletePopup.productName}"
              </span>
              ? This action is irreversible.
            </p>
            <div className={styles.popupButtons}>
              <button
                className={styles.cancelBtn}
                onClick={() =>
                  setPermanentDeletePopup({
                    open: false,
                    productId: null,
                    productName: "",
                  })
                }
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={confirmPermanentDelete}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}