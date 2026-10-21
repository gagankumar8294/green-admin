"use client";

import { useEffect, useState, useMemo } from "react";
import styles from "./RegisteredUsers.module.css";
import {
  FiUsers,
  FiShoppingBag,
  FiDollarSign,
  FiShoppingCart,
  FiSearch,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiCopy,
  FiCheck,
  FiX,
  FiChevronRight,
  FiRefreshCw,
  FiAlertCircle,
  FiActivity,
} from "react-icons/fi";
import { FaGoogle, FaWhatsapp } from "react-icons/fa";
import CustomDropdown from "@/components/Shared/CustomDropdown";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest Registered" },
  { value: "ltv_desc", label: "Highest Spend (LTV)" },
  { value: "orders_desc", label: "Most Orders" },
  { value: "name_asc", label: "Name (A-Z)" },
];

export default function RegisteredUsers() {
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalLTV: 0,
    activeBuyers: 0,
    activeCarts: 0,
    newUsersThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'buyers', 'carts', 'new', 'no_orders'
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'ltv_desc', 'orders_desc', 'name_asc'
  const [selectedUser, setSelectedUser] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: {
          "x-admin-authorization": "romeoPistol",
        },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error("Error fetching registered users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(id);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return "";
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  // Filtered & Sorted Users
  const processedUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = users.filter((u) => {
      // 1. Search Query
      if (q) {
        const nameMatch = u.name?.toLowerCase().includes(q);
        const emailMatch = u.email?.toLowerCase().includes(q);
        const phoneMatch = u.address?.phone?.toLowerCase().includes(q);
        const cityMatch = u.address?.city?.toLowerCase().includes(q);
        const stateMatch = u.address?.state?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !phoneMatch && !cityMatch && !stateMatch) {
          return false;
        }
      }

      // 2. Filter tabs
      if (filter === "buyers") return u.metrics.paidOrdersCount > 0;
      if (filter === "carts") return u.cart.hasActiveCart;
      if (filter === "new") {
        const regTime = new Date(u.registeredAt).getTime();
        return Date.now() - regTime <= 7 * 24 * 60 * 60 * 1000;
      }
      if (filter === "no_orders") return u.metrics.totalOrders === 0;

      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.registeredAt) - new Date(a.registeredAt);
      }
      if (sortBy === "ltv_desc") {
        return (b.metrics.totalSpent || 0) - (a.metrics.totalSpent || 0);
      }
      if (sortBy === "orders_desc") {
        return (b.metrics.totalOrders || 0) - (a.metrics.totalOrders || 0);
      }
      if (sortBy === "name_asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      return 0;
    });
  }, [users, search, filter, sortBy]);

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Registered Customers</h1>
          <p className={styles.subtitle}>
            Comprehensive single-line directory with profile images, registration timestamps, and customer lifetime metrics
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className={styles.refreshBtn}
          title="Refresh Customer Data"
          disabled={loading}
        >
          <FiRefreshCw className={loading ? styles.spinning : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.blueIcon}`}>
            <FiUsers />
          </div>
          <div>
            <div className={styles.kpiValue}>{summary.totalUsers}</div>
            <div className={styles.kpiLabel}>Total Registered Users</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.greenIcon}`}>
            <FiDollarSign />
          </div>
          <div>
            <div className={styles.kpiValue}>₹{summary.totalLTV.toLocaleString("en-IN")}</div>
            <div className={styles.kpiLabel}>Customer Lifetime Value (LTV)</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.purpleIcon}`}>
            <FiShoppingBag />
          </div>
          <div>
            <div className={styles.kpiValue}>{summary.activeBuyers}</div>
            <div className={styles.kpiLabel}>Active Buyers (Paid Orders)</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.amberIcon}`}>
            <FiShoppingCart />
          </div>
          <div>
            <div className={styles.kpiValue}>{summary.activeCarts}</div>
            <div className={styles.kpiLabel}>Users with Items in Cart</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, email, phone, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch("")} className={styles.clearSearch}>
              <FiX />
            </button>
          )}
        </div>

        <div className={styles.filterPills}>
          <button
            className={`${styles.filterPill} ${filter === "all" ? styles.activePill : ""}`}
            onClick={() => setFilter("all")}
          >
            All Users ({users.length})
          </button>
          <button
            className={`${styles.filterPill} ${filter === "buyers" ? styles.activePill : ""}`}
            onClick={() => setFilter("buyers")}
          >
            Buyers ({summary.activeBuyers})
          </button>
          <button
            className={`${styles.filterPill} ${filter === "carts" ? styles.activePill : ""}`}
            onClick={() => setFilter("carts")}
          >
            Active Cart ({summary.activeCarts})
          </button>
          <button
            className={`${styles.filterPill} ${filter === "new" ? styles.activePill : ""}`}
            onClick={() => setFilter("new")}
          >
            New This Week ({summary.newUsersThisWeek})
          </button>
          <button
            className={`${styles.filterPill} ${filter === "no_orders" ? styles.activePill : ""}`}
            onClick={() => setFilter("no_orders")}
          >
            No Orders Yet
          </button>
        </div>

        <div className={styles.sortWrapper}>
          <label className={styles.sortLabel}>Sort By:</label>
          <CustomDropdown
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={(val) => setSortBy(val?.target ? val.target.value : val)}
            size="sm"
          />
        </div>
      </div>

      {/* Horizontal Scroll Hint */}
      <div className={styles.scrollHint}>
        <span>← Scroll horizontally to view all columns in a single line →</span>
      </div>

      {/* Users List Table / Horizontal Single Line View */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading registered customers...</p>
        </div>
      ) : processedUsers.length === 0 ? (
        <div className={styles.emptyState}>
          <FiAlertCircle size={40} className={styles.emptyIcon} />
          <h3>No matching customers found</h3>
          <p>Try adjusting your search criteria or filter options.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.usersTable}>
            <thead>
              <tr>
                <th style={{ width: "220px" }}>Customer</th>
                <th style={{ width: "240px" }}>Email</th>
                <th style={{ width: "160px" }}>Phone / WhatsApp</th>
                <th style={{ width: "210px" }}>Registered Date &amp; Time</th>
                <th style={{ width: "170px" }}>City / State</th>
                <th style={{ width: "130px" }}>Lifetime Spend</th>
                <th style={{ width: "180px" }}>Order History</th>
                <th style={{ width: "160px" }}>Current Cart</th>
                <th style={{ width: "120px" }}>Last Active</th>
                <th style={{ width: "120px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {processedUsers.map((user) => {
                const phone = user.address?.phone;
                const formattedPhone = phone ? phone.replace(/[^0-9]/g, "") : null;
                const whatsappUrl = formattedPhone
                  ? `https://wa.me/91${formattedPhone.length === 10 ? formattedPhone : formattedPhone.slice(-10)}?text=${encodeURIComponent(`Hello ${user.name}, this is Happy Greenery customer support 🌱`)}`
                  : null;

                return (
                  <tr key={user._id} className={styles.userRow}>
                    {/* 1. Customer: Avatar + Name + Google Badge */}
                    <td>
                      <div className={styles.singleLineCell}>
                        <div className={styles.avatarWrapper}>
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name}
                              className={styles.avatarImg}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={styles.avatarFallback}
                            style={{ display: user.image ? "none" : "flex" }}
                          >
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          {user.googleId && (
                            <div className={styles.googleBadge} title="Signed in with Google">
                              <FaGoogle />
                            </div>
                          )}
                        </div>
                        <span className={styles.userNameText} title={user.name}>
                          {user.name}
                        </span>
                      </div>
                    </td>

                    {/* 2. Email Address with Copy Button */}
                    <td>
                      <div className={styles.singleLineCell}>
                        <FiMail className={styles.cellIcon} />
                        <span className={styles.userEmailText} title={user.email}>
                          {user.email}
                        </span>
                        <button
                          onClick={() => copyToClipboard(user.email, user._id)}
                          className={styles.copyBtn}
                          title="Copy Email"
                        >
                          {copiedEmail === user._id ? (
                            <FiCheck className={styles.checkIcon} />
                          ) : (
                            <FiCopy />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* 3. Phone / WhatsApp */}
                    <td>
                      <div className={styles.singleLineCell}>
                        {phone ? (
                          <>
                            <FiPhone className={styles.cellIcon} />
                            <span className={styles.phoneText}>{phone}</span>
                            {whatsappUrl && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.whatsappIconBtn}
                                title="Chat with customer on WhatsApp"
                              >
                                <FaWhatsapp />
                              </a>
                            )}
                          </>
                        ) : (
                          <span className={styles.mutedText}>Not provided</span>
                        )}
                      </div>
                    </td>

                    {/* 4. Registration Date & Time */}
                    <td>
                      <div className={styles.singleLineCell}>
                        <FiCalendar className={styles.cellIcon} />
                        <span className={styles.datePrimaryText}>
                          {formatDate(user.registeredAt)}, {formatTime(user.registeredAt)}
                        </span>
                        <span className={styles.relativeBadge}>
                          {getRelativeTime(user.registeredAt)}
                        </span>
                      </div>
                    </td>

                    {/* 5. City & State */}
                    <td>
                      <div className={styles.singleLineCell}>
                        <FiMapPin className={styles.cellIcon} />
                        <span className={styles.locationText} title={`${user.address?.street || ""}, ${user.address?.city || ""}, ${user.address?.state || ""}`}>
                          {user.address?.city
                            ? `${user.address.city}${user.address.state ? `, ${user.address.state}` : ""}`
                            : "No address"}
                        </span>
                      </div>
                    </td>

                    {/* 6. Lifetime Spend (LTV) */}
                    <td>
                      <div className={styles.singleLineCell}>
                        <span className={styles.ltvBadgeText}>
                          ₹{user.metrics.totalSpent.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </td>

                    {/* 7. Orders Breakdown */}
                    <td>
                      <div className={styles.singleLineCell}>
                        <span className={styles.orderPill}>
                          {user.metrics.paidOrdersCount} Paid
                        </span>
                        {user.metrics.failedOrdersCount > 0 && (
                          <span className={`${styles.orderPill} ${styles.failedPill}`}>
                            {user.metrics.failedOrdersCount} Incomplete
                          </span>
                        )}
                        {user.metrics.totalOrders === 0 && (
                          <span className={styles.mutedText}>0 Orders</span>
                        )}
                      </div>
                    </td>

                    {/* 8. Active Cart */}
                    <td>
                      <div className={styles.singleLineCell}>
                        {user.cart.hasActiveCart ? (
                          <span className={styles.activeCartPill}>
                            <FiShoppingCart /> {user.cart.itemsCount} {user.cart.itemsCount === 1 ? "Plant" : "Plants"} (₹{user.cart.total})
                          </span>
                        ) : (
                          <span className={styles.emptyCartBadge}>Empty</span>
                        )}
                      </div>
                    </td>

                    {/* 9. Last Active */}
                    <td>
                      <div className={styles.singleLineCell}>
                        <span className={styles.lastActiveText}>
                          {getRelativeTime(user.lastActive)}
                        </span>
                      </div>
                    </td>

                    {/* 10. Action Button */}
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className={styles.viewDetailsBtn}
                      >
                        <span>View</span>
                        <FiChevronRight />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Full Detail Modal */}
      {selectedUser && (
        <div className={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
          <div
            className={styles.modalContainer}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalUserHeader}>
                <div className={styles.modalAvatarWrapper}>
                  {selectedUser.image ? (
                    <img
                      src={selectedUser.image}
                      alt={selectedUser.name}
                      className={styles.modalAvatarImg}
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <div
                    className={styles.modalAvatarFallback}
                    style={{ display: selectedUser.image ? "none" : "flex" }}
                  >
                    {selectedUser.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                </div>
                <div>
                  <h2 className={styles.modalUserName}>{selectedUser.name}</h2>
                  <div className={styles.modalUserEmailRow}>
                    <span>{selectedUser.email}</span>
                    <button
                      onClick={() => copyToClipboard(selectedUser.email, "modal")}
                      className={styles.copyBtn}
                    >
                      {copiedEmail === "modal" ? <FiCheck /> : <FiCopy />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className={styles.modalCloseBtn}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {/* Profile Details Grid */}
              <div className={styles.modalGrid}>
                <div className={styles.infoBox}>
                  <div className={styles.infoBoxLabel}>
                    <FiCalendar /> Registration Timestamp
                  </div>
                  <div className={styles.infoBoxVal}>
                    {formatDate(selectedUser.registeredAt)} at {formatTime(selectedUser.registeredAt)}
                  </div>
                  <div className={styles.infoBoxSub}>
                    Account created {getRelativeTime(selectedUser.registeredAt)}
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <div className={styles.infoBoxLabel}>
                    <FiDollarSign /> Lifetime Value (LTV)
                  </div>
                  <div className={styles.infoBoxVal} style={{ color: "#10b981" }}>
                    ₹{selectedUser.metrics.totalSpent.toLocaleString("en-IN")}
                  </div>
                  <div className={styles.infoBoxSub}>
                    {selectedUser.metrics.paidOrdersCount} completed orders
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <div className={styles.infoBoxLabel}>
                    <FiPhone /> Contact &amp; Communication
                  </div>
                  <div className={styles.infoBoxVal}>
                    {selectedUser.address?.phone || "No phone provided"}
                  </div>
                  {selectedUser.address?.phone && (
                    <div style={{ marginTop: "6px" }}>
                      <a
                        href={`https://wa.me/91${selectedUser.address.phone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(`Hello ${selectedUser.name}, this is Happy Greenery regarding your orders 🌱`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.modalWhatsappBtn}
                      >
                        <FaWhatsapp /> Chat on WhatsApp
                      </a>
                    </div>
                  )}
                </div>

                <div className={styles.infoBox}>
                  <div className={styles.infoBoxLabel}>
                    <FiMapPin /> Delivery Address
                  </div>
                  {selectedUser.address ? (
                    <div className={styles.infoBoxVal} style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                      {selectedUser.address.street && <div>{selectedUser.address.street}</div>}
                      <div>
                        {selectedUser.address.city || ""}, {selectedUser.address.state || ""} - {selectedUser.address.pincode || ""}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.infoBoxVal} style={{ color: "#64748b" }}>
                      No address saved yet
                    </div>
                  )}
                </div>
              </div>

              {/* Active Cart Section */}
              {selectedUser.cart.hasActiveCart && (
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>
                    <FiShoppingCart style={{ color: "#f59e0b" }} /> Active Items in Cart ({selectedUser.cart.itemsCount})
                  </h3>
                  <div className={styles.cartItemsList}>
                    {selectedUser.cart.items.map((item, idx) => (
                      <div key={idx} className={styles.cartItemRow}>
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=100"}
                          alt={item.name}
                          className={styles.cartItemImg}
                        />
                        <div style={{ flex: 1 }}>
                          <div className={styles.cartItemName}>{item.name}</div>
                          <div className={styles.cartItemMeta}>
                            Quantity: {item.quantity} × ₹{item.price}
                          </div>
                        </div>
                        <div className={styles.cartItemPrice}>
                          ₹{item.price * item.quantity}
                        </div>
                      </div>
                    ))}
                    <div className={styles.cartTotalRow}>
                      <span>Estimated Cart Total:</span>
                      <strong>₹{selectedUser.cart.total.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Order History Section */}
              <div className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>
                  <FiShoppingBag style={{ color: "#3b82f6" }} /> Order History ({selectedUser.orders.length})
                </h3>
                {selectedUser.orders.length === 0 ? (
                  <div className={styles.emptyOrders}>
                    No orders placed yet by this user.
                  </div>
                ) : (
                  <div className={styles.ordersList}>
                    {selectedUser.orders.map((order) => (
                      <div key={order._id} className={styles.orderCard}>
                        <div className={styles.orderCardHeader}>
                          <div>
                            <span className={styles.orderId}>
                              #{order._id.slice(-6).toUpperCase()}
                            </span>
                            <span className={styles.orderDate}>
                              {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                            </span>
                          </div>
                          <div className={styles.orderBadges}>
                            <span
                              className={`${styles.statusBadge} ${
                                order.status === "PAID"
                                  ? styles.statusPaid
                                  : order.status === "PENDING"
                                  ? styles.statusPending
                                  : styles.statusFailed
                              }`}
                            >
                              {order.status}
                            </span>
                            {order.orderStatus && (
                              <span className={styles.deliveryBadge}>
                                {order.orderStatus}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className={styles.orderItemsGrid}>
                          {order.items.map((it, i) => (
                            <div key={i} className={styles.orderItemSnippet}>
                              {it.image && (
                                <img
                                  src={it.image}
                                  alt={it.name}
                                  className={styles.orderItemThumb}
                                />
                              )}
                              <span className={styles.orderItemText}>
                                {it.name} <span style={{ color: "#64748b" }}>× {it.quantity}</span>
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className={styles.orderCardFooter}>
                          <span>Total Amount:</span>
                          <strong className={styles.orderTotalAmount}>
                            ₹{order.totalAmount}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
