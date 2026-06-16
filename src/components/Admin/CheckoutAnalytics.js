"use client";

import { useEffect, useState } from "react";
import styles from "./CheckoutAnalytics.module.css";
import { API_BASE_URL } from "@/config/api";

export default function CheckoutAnalytics() {
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'paid', 'abandoned'
  const [search, setSearch] = useState("");

  // Session Journey Modal states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [userJourney, setUserJourney] = useState(null);
  const [loadingJourney, setLoadingJourney] = useState(false);

  const fetchCheckouts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/checkout-analytics`, {
        credentials: "include",
        headers: {
          "x-admin-authorization": "romeoPistol",
        },
      });
      const data = await res.json();
      if (data.success) {
        setCheckouts(data.orders || []);
      }
    } catch (err) {
      console.error("Error fetching checkout analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckouts();
  }, []);

  // Compute KPI values
  const totalStarts = checkouts.length;
  const completedPurchases = checkouts.filter((c) => c.status === "PAID");
  const completedCount = completedPurchases.length;
  const conversionRate = totalStarts > 0 ? ((completedCount / totalStarts) * 100).toFixed(1) : 0;

  const abandonedCheckouts = checkouts.filter(
    (c) => c.status === "PENDING" || c.status === "CANCELLED" || c.status === "FAILED"
  );
  const abandonedCount = abandonedCheckouts.length;
  const abandonmentRate = totalStarts > 0 ? ((abandonedCount / totalStarts) * 100).toFixed(1) : 0;

  const completedRevenue = completedPurchases.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const lostRevenue = abandonedCheckouts.reduce((sum, c) => sum + (c.totalAmount || 0), 0);

  // Filter checkouts based on selection and search
  const filteredCheckouts = checkouts.filter((c) => {
    // 1. Status Filter
    if (filter === "paid" && c.status !== "PAID") return false;
    if (
      filter === "abandoned" &&
      c.status !== "PENDING" &&
      c.status !== "CANCELLED" &&
      c.status !== "FAILED"
    ) {
      return false;
    }

    // 2. Search Filter (customer name, email, phone, pin, city, order ID)
    if (search.trim() !== "") {
      const term = search.toLowerCase();
      const customerName = c.user?.name || c.address?.fullName || "";
      const customerEmail = c.user?.email || "";
      const customerPhone = c.address?.phone || "";
      const orderId = c._id || "";
      const city = c.address?.city || "";
      const pin = c.address?.pincode || "";

      return (
        customerName.toLowerCase().includes(term) ||
        customerEmail.toLowerCase().includes(term) ||
        customerPhone.includes(term) ||
        orderId.includes(term) ||
        city.toLowerCase().includes(term) ||
        pin.includes(term)
      );
    }

    return true;
  });

  // Fetch session flow for a selected customer
  const handleViewJourney = async (customer) => {
    if (!customer?.user?._id) {
      alert("This checkout does not have a registered user ID linked.");
      return;
    }

    setSelectedCustomer(customer);
    setLoadingJourney(true);
    setUserJourney(null);

    try {
      // Fetch session matching userId
      const res = await fetch(
        `${API_BASE_URL}/api/analytics/sessions?userId=${customer.user._id}&limit=5`,
        {
          credentials: "include",
          headers: {
            "x-admin-authorization": "romeoPistol",
          },
        }
      );
      const data = await res.json();
      if (data.success && data.sessions?.length > 0) {
        // Find session that is closest to this order time, or take the first/latest one
        setUserJourney(data.sessions[0]);
      } else {
        setUserJourney(null);
      }
    } catch (err) {
      console.error("Error loading user journey:", err);
    } finally {
      setLoadingJourney(false);
    }
  };

  const closeJourneyModal = () => {
    setSelectedCustomer(null);
    setUserJourney(null);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PAID":
        return "Completed Payment";
      case "PENDING":
        return "Left in Checkout (Abandoned)";
      case "CANCELLED":
        return "Payment Cancelled";
      case "FAILED":
        return "Payment Failed";
      default:
        return status;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleSection}>
        <h1 className={styles.title}>Checkout Analytics & Abandonment</h1>
        <p className={styles.subtitle}>
          Track checkout attempts, monitor payments, and inspect where customers drop off.
        </p>
      </div>

      {/* KPI Cards section */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div>
            <div className={styles.kpiLabel}>Checkout Starts</div>
            <div className={styles.kpiValue}>{totalStarts}</div>
          </div>
          <div className={styles.kpiSubtext}>Total order intents created</div>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: "4px solid #10b981" }}>
          <div>
            <div className={styles.kpiLabel}>Completed Purchases</div>
            <div className={styles.kpiValue}>{completedCount}</div>
          </div>
          <div className={styles.kpiSubtext}>
            {conversionRate}% Conversion Rate
          </div>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: "4px solid #f59e0b" }}>
          <div>
            <div className={styles.kpiLabel}>Abandoned Checkouts</div>
            <div className={styles.kpiValue}>{abandonedCount}</div>
          </div>
          <div className={styles.kpiSubtext}>
            {abandonmentRate}% Abandonment Rate
          </div>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: "4px solid #3b82f6" }}>
          <div>
            <div className={styles.kpiLabel}>Recovered Revenue</div>
            <div className={styles.kpiValue}>₹{completedRevenue.toLocaleString("en-IN")}</div>
          </div>
          <div className={styles.kpiSubtext}>Completed payments</div>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: "4px solid #ef4444" }}>
          <div>
            <div className={styles.kpiLabel}>Estimated Lost Revenue</div>
            <div className={styles.kpiValue} style={{ color: "#ef4444" }}>
              ₹{lostRevenue.toLocaleString("en-IN")}
            </div>
          </div>
          <div className={styles.kpiSubtext}>Left in cart at checkout</div>
        </div>
      </div>

      {/* Controls: Search and Filters */}
      <div className={styles.controlsRow}>
        <div className={styles.searchBar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name, email, phone, city or PIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <button
            className={`${styles.filterBtn} ${filter === "all" ? styles.filterBtnActive : ""}`}
            onClick={() => setFilter("all")}
          >
            All Intents ({checkouts.length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === "paid" ? styles.filterBtnActive : ""}`}
            onClick={() => setFilter("paid")}
          >
            Completed ({completedCount})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === "abandoned" ? styles.filterBtnActive : ""}`}
            onClick={() => setFilter("abandoned")}
          >
            Abandoned ({abandonedCount})
          </button>
        </div>
      </div>

      {/* Checkout list view */}
      {loading ? (
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>Loading checkout records...</p>
        </div>
      ) : filteredCheckouts.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No checkout records found matching your filters.</p>
        </div>
      ) : (
        <div className={styles.checkoutList}>
          {filteredCheckouts.map((checkout) => {
            const customerName = checkout.user?.name || checkout.address?.fullName || "Guest Account";
            const customerEmail = checkout.user?.email || "No Email Provided";
            const customerPhone = checkout.address?.phone || "No Phone Provided";

            return (
              <div key={checkout._id} className={styles.checkoutCard}>
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.customerInfo}>
                    <h3>{customerName}</h3>
                    <div className={styles.customerMeta}>
                      <span>📧 {customerEmail}</span>
                      <span>📞 {customerPhone}</span>
                      {checkout.address?.city && (
                        <span>📍 {checkout.address.city}, {checkout.address.state}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardMeta}>
                    <span
                      className={`${styles.statusBadge} ${
                        checkout.status === "PAID"
                          ? styles.statusPaid
                          : checkout.status === "PENDING"
                          ? styles.statusPending
                          : checkout.status === "CANCELLED"
                          ? styles.statusCancelled
                          : styles.statusFailed
                      }`}
                    >
                      {getStatusLabel(checkout.status)}
                    </span>
                    <span className={styles.timestamp}>
                      {new Date(checkout.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Items & Address Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
                  {/* Cart Items */}
                  <div className={styles.cartSection}>
                    <h4>Cart Checkout Items</h4>
                    <div className={styles.cartItemsList}>
                      {checkout.items?.map((item, index) => (
                        <div key={index} className={styles.cartItemRow}>
                          <img src={item.image} alt={item.name} className={styles.itemImage} />
                          <div className={styles.itemName}>{item.name}</div>
                          <div className={styles.itemDetails}>
                            ₹{item.price} × {item.quantity}
                          </div>
                          <div className={styles.itemTotal}>₹{item.price * item.quantity}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {checkout.address?.street ? (
                    <div className={styles.addressSection}>
                      <h4>Delivery Location</h4>
                      <div style={{ fontSize: "13px", lineHeight: "1.4", opacity: "0.9" }}>
                        <p style={{ margin: "0 0 4px 0", fontWeight: "600" }}>
                          {checkout.address.fullName}
                        </p>
                        <p style={{ margin: "0 0 4px 0" }}>{checkout.address.street}</p>
                        <p style={{ margin: "0 0 4px 0" }}>
                          {checkout.address.city}, {checkout.address.state} -{" "}
                          {checkout.address.pincode}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.addressSection}>
                      <h4>Delivery Location</h4>
                      <p style={{ fontSize: "13px", opacity: "0.6", margin: 0 }}>
                        No address captured yet.
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className={styles.cardFooter}>
                  <div className={styles.totalAmount}>
                    Total Value: ₹{checkout.totalAmount}
                  </div>

                  <div className={styles.actionsGroup}>
                    {checkout.user?._id && (
                      <button
                        className={styles.viewJourneyBtn}
                        onClick={() => handleViewJourney(checkout)}
                      >
                        🧭 View Journey Flow
                      </button>
                    )}
                    {checkout.user?.email && (
                      <a
                        href={`mailto:${checkout.user.email}?subject=Did you forget something?&body=Hi ${customerName}, we noticed you left some beautiful plants in your checkout. Can we help you complete your order?`}
                        className={styles.contactBtn}
                        style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                      >
                        ✉️ Contact Customer
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* User Journey Flow Modal Overlay */}
      {selectedCustomer && (
        <div className={styles.modalOverlay} onClick={closeJourneyModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                Visitor Journey: {selectedCustomer.user?.name || selectedCustomer.address?.fullName}
              </h3>
              <button className={styles.closeModalBtn} onClick={closeJourneyModal}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {loadingJourney ? (
                <div className={styles.loader}>
                  <div className={styles.spinner}></div>
                  <p>Fetching user navigation timeline...</p>
                </div>
              ) : !userJourney || !userJourney.events || userJourney.events.length === 0 ? (
                <div className={styles.noJourney}>
                  <p>No tracking events matched this customer's session.</p>
                </div>
              ) : (
                <div className={styles.timeline}>
                  {userJourney.events.map((event, index) => {
                    const isNav = event.type === "nav";
                    const displayTime = formatTime(event.timestamp);

                    return (
                      <div
                        key={index}
                        className={`${styles.timelineNode} ${
                          isNav ? styles.nodeNav : styles.nodeClick
                        }`}
                      >
                        <div className={styles.nodeTime}>{displayTime}</div>

                        <div className={styles.nodeConnector}>
                          <div className={styles.nodeLine}></div>
                          <div className={styles.nodeIcon}>{isNav ? "🧭" : "🖱️"}</div>
                        </div>

                        <div className={styles.nodeCard}>
                          <div className={styles.nodeCardHeader}>
                            <span
                              className={`${styles.nodeBadge} ${
                                isNav ? styles.nodeBadgeNav : styles.nodeBadgeClick
                              }`}
                            >
                              {isNav ? "View Page" : "Click Interaction"}
                            </span>
                            {isNav && event.duration > 0 && (
                              <span className={styles.nodeDuration}>⏱️ {event.duration}s</span>
                            )}
                          </div>

                          {isNav ? (
                            <p className={styles.nodePath}>{event.path}</p>
                          ) : (
                            <div>
                              <p className={styles.nodeLabel}>“{event.label}”</p>
                              <span className={styles.nodeSubtext}>on {event.path}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
