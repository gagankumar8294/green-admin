"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import styles from "./adminOrders.module.css";
import { API_BASE_URL } from "@/config/api";
import {
  FiLoader,
  FiAlertCircle,
  FiSearch,
  FiPackage,
  FiMapPin,
  FiCreditCard,
  FiChevronDown,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiTruck,
  FiUser,
  FiPhone,
  FiMail,
  FiCopy,
  FiCheck,
  FiRefreshCw,
  FiCalendar,
  FiDollarSign,
  FiX,
  FiArrowUpRight,
} from "react-icons/fi";
import { MdSpa } from "react-icons/md";
import CustomDropdown from "@/components/Shared/CustomDropdown";

const STEPS = ["ORDERED", "SHIPPED", "PICKED", "ARRIVED", "DELIVERED"];

const TIMELINE_MAP = {
  ORDERED: "orderedAt",
  SHIPPED: "shippedAt",
  PICKED: "pickedAt",
  ARRIVED: "arrivedAt",
  DELIVERED: "deliveredAt",
};

const PAYMENT_OPTIONS = [
  { value: "ALL", label: "All Payments" },
  { value: "PAID", label: "PAID" },
  { value: "PENDING", label: "PENDING" },
  { value: "CANCELLED", label: "CANCELLED" },
];

const FULFILLMENT_OPTIONS = [
  { value: "ALL", label: "All Fulfillments" },
  ...STEPS.map((step) => ({ value: step, label: step })),
];

const SORT_OPTIONS = [
  { value: "date-newest", label: "Date: Newest First" },
  { value: "date-oldest", label: "Date: Oldest First" },
  { value: "amount-desc", label: "Amount: High to Low" },
  { value: "amount-asc", label: "Amount: Low to High" },
];

const formatOrderDate = (dateVal) => {
  if (!dateVal) return "-";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [updatingStep, setUpdatingStep] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date-newest");

  // Date Range States
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleFromDateChange = (e) => {
    const val = e.target.value;
    setFromDate(val);
    // If toDate is already set and earlier than new fromDate, adjust toDate
    if (toDate && val && toDate < val) {
      setToDate(val);
    }
  };

  const handleToDateChange = (e) => {
    const val = e.target.value;
    setToDate(val);
  };

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
  };

  const applyDatePreset = (preset) => {
    const today = new Date();
    const formatYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "today") {
      const dStr = formatYMD(today);
      setFromDate(dStr);
      setToDate(dStr);
    } else if (preset === "7days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 6);
      setFromDate(formatYMD(past));
      setToDate(formatYMD(today));
    } else if (preset === "30days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 29);
      setFromDate(formatYMD(past));
      setToDate(formatYMD(today));
    } else if (preset === "thisMonth") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(formatYMD(start));
      setToDate(formatYMD(today));
    }
  };

  // Fetch orders from API
  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders`, {
        credentials: "include",
        headers: {
          "x-admin-authorization": "romeoPistol",
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update order fulfillment status
  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingOrderId(orderId);
      setUpdatingStep(status);

      const res = await fetch(
        `${API_BASE_URL}/api/admin/orders/${orderId}/status`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-admin-authorization": "romeoPistol",
          },
          body: JSON.stringify({ orderStatus: status }),
        }
      );

      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? data.order : o))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingOrderId(null);
      setUpdatingStep(null);
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text, key) => {
    if (!text || text === "-") return;
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => {
      setCopiedId((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setPaymentFilter("ALL");
    setFulfillmentFilter("ALL");
    setSortBy("date-newest");
    setFromDate("");
    setToDate("");
  };

  // KPI Statistics
  const stats = useMemo(() => {
    const total = orders.length;
    const paidList = orders.filter((o) => o.status === "PAID");
    const pendingList = orders.filter(
      (o) => o.status === "PENDING" || o.orderStatus === "ORDERED"
    );
    const deliveredList = orders.filter((o) => o.orderStatus === "DELIVERED");
    const totalRevenue = paidList.reduce(
      (sum, o) => sum + (Number(o.totalAmount) || 0),
      0
    );

    return {
      total,
      paidCount: paidList.length,
      pendingCount: pendingList.length,
      deliveredCount: deliveredList.length,
      totalRevenue,
    };
  }, [orders]);

  // Memoized filtered & sorted orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o._id?.toLowerCase().includes(q) ||
          o.address?.fullName?.toLowerCase().includes(q) ||
          o.address?.phone?.includes(q) ||
          o.address?.city?.toLowerCase().includes(q) ||
          o.address?.street?.toLowerCase().includes(q) ||
          o.address?.state?.toLowerCase().includes(q) ||
          o.address?.pincode?.includes(q) ||
          o.user?.name?.toLowerCase().includes(q) ||
          o.user?.email?.toLowerCase().includes(q) ||
          o.payment?.razorpayOrderId?.toLowerCase().includes(q) ||
          o.payment?.razorpayPaymentId?.toLowerCase().includes(q) ||
          o.items?.some((it) => it.name?.toLowerCase().includes(q))
      );
    }

    if (paymentFilter !== "ALL") {
      result = result.filter((o) => o.status === paymentFilter);
    }

    if (fulfillmentFilter !== "ALL") {
      result = result.filter((o) => o.orderStatus === fulfillmentFilter);
    }

    // Date Range Filtering (Only include records between fromDate and toDate)
    if (fromDate) {
      const [fYear, fMonth, fDay] = fromDate.split("-").map(Number);
      const fromTime = new Date(fYear, fMonth - 1, fDay, 0, 0, 0, 0).getTime();
      result = result.filter((o) => {
        const oTime = new Date(o.createdAt).getTime();
        return oTime >= fromTime;
      });
    }

    if (toDate) {
      const [tYear, tMonth, tDay] = toDate.split("-").map(Number);
      const toTime = new Date(tYear, tMonth - 1, tDay, 23, 59, 59, 999).getTime();
      result = result.filter((o) => {
        const oTime = new Date(o.createdAt).getTime();
        return oTime <= toTime;
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "date-newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "date-oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "amount-desc":
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case "amount-asc":
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [orders, searchQuery, paymentFilter, fulfillmentFilter, sortBy, fromDate, toDate]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    paymentFilter !== "ALL" ||
    fulfillmentFilter !== "ALL" ||
    sortBy !== "date-newest" ||
    Boolean(fromDate) ||
    Boolean(toDate);

  if (loading) {
    return (
      <div className={styles.page}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "90px 20px",
            gap: "16px",
          }}
        >
          <FiLoader
            size={42}
            color="#10b981"
            className={styles.spinning}
          />
          <p style={{ color: "#9ca3af", fontSize: "0.95rem", margin: 0 }}>
            Fetching orders from database...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ─── TOP ACTIONS ─── */}
      <div className={styles.titleHeader}>
        <div className={styles.headerActions}>
          <button
            onClick={() => fetchOrders(true)}
            className={styles.refreshBtn}
            disabled={refreshing}
            title="Refresh order database"
          >
            <FiRefreshCw
              size={15}
              className={refreshing ? styles.spinning : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ─── KPI STATS GRID ─── */}
      <div className={styles.kpiGrid}>
        <div
          className={styles.kpiCard}
          onClick={() => {
            setPaymentFilter("ALL");
            setFulfillmentFilter("ALL");
          }}
        >
          <div
            className={styles.kpiIconWrap}
            style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}
          >
            <FiPackage size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Total Orders</span>
            <span className={styles.kpiValue}>{stats.total}</span>
            <span className={styles.kpiSubtext}>All store orders</span>
          </div>
        </div>

        <div
          className={styles.kpiCard}
          onClick={() => setPaymentFilter("PAID")}
        >
          <div
            className={styles.kpiIconWrap}
            style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}
          >
            <FiDollarSign size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Paid Revenue</span>
            <span className={styles.kpiValue}>
              ₹{stats.totalRevenue.toLocaleString("en-IN")}
            </span>
            <span className={styles.kpiSubtext}>
              {stats.paidCount} successful payments
            </span>
          </div>
        </div>

        <div
          className={styles.kpiCard}
          onClick={() => setFulfillmentFilter("DELIVERED")}
        >
          <div
            className={styles.kpiIconWrap}
            style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}
          >
            <FiTruck size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Delivered</span>
            <span className={styles.kpiValue}>{stats.deliveredCount}</span>
            <span className={styles.kpiSubtext}>Completed deliveries</span>
          </div>
        </div>

        <div
          className={styles.kpiCard}
          onClick={() => setPaymentFilter("PENDING")}
        >
          <div
            className={styles.kpiIconWrap}
            style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}
          >
            <FiClock size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Pending / Action</span>
            <span className={styles.kpiValue}>{stats.pendingCount}</span>
            <span className={styles.kpiSubtext}>Awaiting fulfillment/pay</span>
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER CONTROLS ─── */}
      <div className={styles.controlsPanel}>
        <div className={styles.searchAndDropdownsRow}>
          {/* SEARCH BAR */}
          <div className={styles.searchBarWrapper}>
            <label>Search Orders</label>
            <div className={styles.searchInputContainer}>
              <FiSearch size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by Order ID, Customer Name, Email, Phone, City..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className={styles.clearSearchBtn}
                  title="Clear search"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* DATE RANGE FILTER (Commented out per request — functionality retained) */}
          {/*
          <div className={styles.dateFilterControl}>
            <div className={styles.dateLabelRow}>
              <label>
                <FiCalendar size={12} /> Order Date
              </label>
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={clearDateFilter}
                  className={styles.clearDateBtn}
                >
                  Clear Date
                </button>
              )}
            </div>

            <div className={styles.dateRangeBox}>
              <FiCalendar size={14} className={styles.dateCalendarIcon} />

              <div className={styles.dateField}>
                <span className={styles.dateTag}>From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={handleFromDateChange}
                  max={toDate || undefined}
                  className={styles.dateInput}
                  aria-label="From Date"
                  title="Select From date"
                />
              </div>

              <span className={styles.dateDivider}>→</span>

              <div
                className={`${styles.dateField} ${
                  !fromDate ? styles.dateFieldDisabled : ""
                }`}
                title={
                  !fromDate
                    ? "Select 'From' date first"
                    : "Select 'To' date"
                }
              >
                <span className={styles.dateTag}>To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={handleToDateChange}
                  min={fromDate || undefined}
                  disabled={!fromDate}
                  className={styles.dateInput}
                  aria-label="To Date"
                />
              </div>

              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={clearDateFilter}
                  className={styles.dateInlineClear}
                  title="Reset date filter"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>
          </div>
          */}

          {/* DROPDOWN FILTERS */}
          <div className={styles.filterGroup}>
            <div className={styles.filterControl}>
              <label>Payment Status</label>
              <CustomDropdown
                value={paymentFilter}
                options={PAYMENT_OPTIONS}
                onChange={(e) =>
                  setPaymentFilter(e?.target ? e.target.value : e)
                }
              />
            </div>

            <div className={styles.filterControl}>
              <label>Fulfillment Status</label>
              <CustomDropdown
                value={fulfillmentFilter}
                options={FULFILLMENT_OPTIONS}
                onChange={(e) =>
                  setFulfillmentFilter(e?.target ? e.target.value : e)
                }
              />
            </div>

            <div className={styles.filterControl}>
              <label>Sort By</label>
              <CustomDropdown
                value={sortBy}
                options={SORT_OPTIONS}
                onChange={(e) => setSortBy(e?.target ? e.target.value : e)}
              />
            </div>
          </div>
        </div>

        {/* QUICK FILTER PILLS & COUNT */}
        <div className={styles.quickFiltersRow}>
          <div className={styles.pillsContainer}>
            <button
              onClick={() => {
                setPaymentFilter("ALL");
                setFulfillmentFilter("ALL");
              }}
              className={`${styles.pillBtn} ${
                paymentFilter === "ALL" && fulfillmentFilter === "ALL"
                  ? styles.pillBtnActive
                  : ""
              }`}
            >
              All Orders
              <span className={styles.pillBadge}>{orders.length}</span>
            </button>

            <button
              onClick={() => {
                setPaymentFilter("PAID");
                setFulfillmentFilter("ALL");
              }}
              className={`${styles.pillBtn} ${
                paymentFilter === "PAID" ? styles.pillBtnActive : ""
              }`}
            >
              <FiCheckCircle size={12} />
              PAID
              <span className={styles.pillBadge}>
                {orders.filter((o) => o.status === "PAID").length}
              </span>
            </button>

            <button
              onClick={() => {
                setPaymentFilter("PENDING");
                setFulfillmentFilter("ALL");
              }}
              className={`${styles.pillBtn} ${
                paymentFilter === "PENDING" ? styles.pillBtnActive : ""
              }`}
            >
              <FiClock size={12} />
              PENDING
              <span className={styles.pillBadge}>
                {orders.filter((o) => o.status === "PENDING").length}
              </span>
            </button>

            <button
              onClick={() => {
                setFulfillmentFilter("DELIVERED");
                setPaymentFilter("ALL");
              }}
              className={`${styles.pillBtn} ${
                fulfillmentFilter === "DELIVERED" ? styles.pillBtnActive : ""
              }`}
            >
              <FiTruck size={12} />
              Delivered
              <span className={styles.pillBadge}>
                {orders.filter((o) => o.orderStatus === "DELIVERED").length}
              </span>
            </button>

            <button
              onClick={() => {
                setPaymentFilter("CANCELLED");
                setFulfillmentFilter("ALL");
              }}
              className={`${styles.pillBtn} ${
                paymentFilter === "CANCELLED" ? styles.pillBtnActive : ""
              }`}
            >
              <FiXCircle size={12} />
              Cancelled
              <span className={styles.pillBadge}>
                {orders.filter((o) => o.status === "CANCELLED").length}
              </span>
            </button>

            {/* Date Preset Pills (Commented out per request — functionality retained) */}
            {/*
            <span style={{ width: 1, height: 16, background: "var(--border-color)", margin: "0 4px", alignSelf: "center" }} />

            <button
              onClick={() => applyDatePreset("today")}
              className={styles.pillBtn}
              title="Orders placed today"
            >
              <FiCalendar size={12} />
              Today
            </button>

            <button
              onClick={() => applyDatePreset("7days")}
              className={styles.pillBtn}
              title="Orders placed in the last 7 days"
            >
              Last 7 Days
            </button>

            <button
              onClick={() => applyDatePreset("thisMonth")}
              className={styles.pillBtn}
              title="Orders placed this month"
            >
              This Month
            </button>
            */}
          </div>

          <div className={styles.filterSummary}>
            <span>
              Showing <strong>{filteredOrders.length}</strong> of{" "}
              <strong>{orders.length}</strong> orders
              {(fromDate || toDate) && (
                <span style={{ marginLeft: 6, color: "#10b981", fontSize: "11px" }}>
                  ({fromDate || "Start"} → {toDate || "Present"})
                </span>
              )}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className={styles.resetFiltersBtn}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── ORDERS LIST OR EMPTY STATE ─── */}
      {filteredOrders.length === 0 ? (
        <div className={styles.noOrders}>
          <FiAlertCircle size={44} color="#6b7280" />
          <p>No orders matched your search and filter criteria.</p>
          {hasActiveFilters && (
            <button onClick={resetFilters} className={styles.pillBtn}>
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        filteredOrders.map((order) => {
          const currentStepIndex = STEPS.indexOf(order.orderStatus);

          return (
            <div key={order._id} className={styles.orderCard}>
              {/* ─── CARD HEADER ─── */}
              <div className={styles.cardHeader}>
                <div className={styles.orderIdent}>
                  <div className={styles.orderIdRow}>
                    <h3 className={styles.orderIdTitle}>Order #{order._id}</h3>
                    <button
                      className={styles.copyBtn}
                      onClick={() => handleCopy(order._id, `order-${order._id}`)}
                      title="Copy Order ID"
                    >
                      {copiedId === `order-${order._id}` ? (
                        <>
                          <FiCheck size={12} color="#10b981" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <FiCopy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className={styles.timestampsRow}>
                    <span className={styles.timeBadge}>
                      <FiCalendar size={12} />
                      Created: {formatOrderDate(order.createdAt)}
                    </span>
                    <span className={styles.timeBadge}>
                      <FiClock size={12} />
                      Updated: {formatOrderDate(order.updatedAt)}
                    </span>
                  </div>
                </div>

                {/* STATUS BADGES */}
                <div className={styles.statusBadges}>
                  <span
                    className={`${styles.badge} ${
                      order.status === "PAID"
                        ? styles.paid
                        : order.status === "CANCELLED"
                        ? styles.cancelled
                        : order.status === "FAILED"
                        ? styles.failed
                        : styles.pending
                    }`}
                  >
                    {order.status === "PAID" && <FiCheckCircle size={13} />}
                    {order.status === "PENDING" && <FiClock size={13} />}
                    {order.status === "CANCELLED" && <FiXCircle size={13} />}
                    {order.status === "FAILED" && <FiAlertCircle size={13} />}
                    {order.status}
                  </span>

                  <span className={styles.fulfillmentBadge}>
                    <FiTruck size={13} />
                    {order.orderStatus}
                  </span>
                </div>
              </div>

              {/* ─── INTERACTIVE FULFILLMENT STEPPER ─── */}
              <div className={styles.stepperWrapper}>
                <div className={styles.stepperTitleRow}>
                  <span className={styles.stepperLabel}>
                    <FiTruck size={14} /> Fulfillment Progress
                  </span>
                  <span className={styles.stepperHint}>
                    Click any stage or use buttons below to update
                  </span>
                </div>

                <div className={styles.stepperTrack}>
                  {STEPS.map((step, idx) => {
                    const isCompleted = currentStepIndex > idx;
                    const isActive = currentStepIndex === idx;
                    const isPending = currentStepIndex < idx;

                    const timelineField = TIMELINE_MAP[step];
                    const timelineDate =
                      order.orderTimeline?.[timelineField] ||
                      (step === "ORDERED" ? order.createdAt : null);

                    const isUpdatingThis =
                      updatingOrderId === order._id && updatingStep === step;

                    return (
                      <div
                        key={step}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flex: idx === STEPS.length - 1 ? "0 0 auto" : "1",
                        }}
                      >
                        <button
                          type="button"
                          className={`${styles.stepNodeWrapper} ${
                            isActive
                              ? styles.stepActive
                              : isCompleted
                              ? styles.stepCompleted
                              : ""
                          }`}
                          disabled={isActive || updatingOrderId === order._id}
                          onClick={() => updateStatus(order._id, step)}
                          title={`Click to set status to ${step}`}
                        >
                          <div className={styles.stepCircle}>
                            {isUpdatingThis ? (
                              <FiLoader
                                size={14}
                                className={styles.spinning}
                              />
                            ) : isCompleted ? (
                              <FiCheck size={14} />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <span className={styles.stepName}>{step}</span>
                          {timelineDate && (
                            <span className={styles.stepTime}>
                              {new Date(timelineDate).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </button>

                        {idx < STEPS.length - 1 && (
                          <div
                            className={`${styles.stepLine} ${
                              currentStepIndex > idx
                                ? styles.stepLineCompleted
                                : ""
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ─── 3-COLUMN DETAILS GRID ─── */}
              <div className={styles.detailsGrid}>
                {/* 1. DELIVERY ADDRESS SECTION */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <FiMapPin size={15} className={styles.sectionHeaderIcon} />
                    <span>Delivery Address</span>
                  </div>
                  <div className={styles.addressContent}>
                    <p className={styles.customerName}>
                      {order.address?.fullName ||
                        order.user?.name ||
                        "Customer Name"}
                    </p>

                    {order.address?.phone && (
                      <a
                        href={`tel:${order.address.phone}`}
                        className={styles.customerPhone}
                        title="Click to call"
                      >
                        <FiPhone size={13} /> {order.address.phone}
                      </a>
                    )}

                    {order.user?.email && (
                      <p className={styles.customerEmail}>
                        <FiMail size={13} /> {order.user.email}
                      </p>
                    )}

                    <div className={styles.addressLines}>
                      <p>
                        {order.address?.street
                          ? `${order.address.street}, `
                          : ""}
                        {order.address?.city || "-"}
                      </p>
                      <p>
                        {order.address?.state || "-"} –{" "}
                        {order.address?.pincode || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. PAYMENT DETAILS SECTION */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <FiCreditCard
                      size={15}
                      className={styles.sectionHeaderIcon}
                    />
                    <span>Payment Details</span>
                  </div>
                  <div className={styles.paymentContent}>
                    <div className={styles.paymentRow}>
                      <span className={styles.paymentKey}>
                        Razorpay Order ID
                      </span>
                      <div className={styles.paymentValRow}>
                        <span className={styles.paymentVal}>
                          {order.payment?.razorpayOrderId || "-"}
                        </span>
                        {order.payment?.razorpayOrderId && (
                          <button
                            className={styles.miniCopyBtn}
                            onClick={() =>
                              handleCopy(
                                order.payment?.razorpayOrderId,
                                `rp-order-${order._id}`
                              )
                            }
                            title="Copy Razorpay Order ID"
                          >
                            {copiedId === `rp-order-${order._id}` ? (
                              <FiCheck size={12} color="#10b981" />
                            ) : (
                              <FiCopy size={12} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={styles.paymentRow}>
                      <span className={styles.paymentKey}>Payment ID</span>
                      <div className={styles.paymentValRow}>
                        <span className={styles.paymentVal}>
                          {order.payment?.razorpayPaymentId || "-"}
                        </span>
                        {order.payment?.razorpayPaymentId && (
                          <button
                            className={styles.miniCopyBtn}
                            onClick={() =>
                              handleCopy(
                                order.payment?.razorpayPaymentId,
                                `rp-pay-${order._id}`
                              )
                            }
                            title="Copy Payment ID"
                          >
                            {copiedId === `rp-pay-${order._id}` ? (
                              <FiCheck size={12} color="#10b981" />
                            ) : (
                              <FiCopy size={12} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={styles.paymentRow}>
                      <span className={styles.paymentKey}>Signature</span>
                      <div className={styles.paymentValRow}>
                        <span
                          className={styles.paymentVal}
                          style={{
                            maxWidth: "180px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {order.payment?.razorpaySignature || "-"}
                        </span>
                        {order.payment?.razorpaySignature && (
                          <button
                            className={styles.miniCopyBtn}
                            onClick={() =>
                              handleCopy(
                                order.payment?.razorpaySignature,
                                `rp-sig-${order._id}`
                              )
                            }
                            title="Copy Signature"
                          >
                            {copiedId === `rp-sig-${order._id}` ? (
                              <FiCheck size={12} color="#10b981" />
                            ) : (
                              <FiCopy size={12} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. ITEMS & FINANCIAL TOTAL SECTION */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <FiPackage
                      size={15}
                      className={styles.sectionHeaderIcon}
                    />
                    <span>Items ({order.items?.length || 0})</span>
                  </div>

                  <div className={styles.itemsList}>
                    {order.items?.map((item, i) => (
                      <div key={i} className={styles.itemRow}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className={styles.itemImage}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=100&auto=format&fit=crop&q=60";
                          }}
                        />
                        <div className={styles.itemInfo}>
                          <strong className={styles.itemName} title={item.name}>
                            {item.name}
                          </strong>
                          <span className={styles.itemMeta}>
                            ₹{item.price} × {item.quantity}
                          </span>
                        </div>
                        <div className={styles.itemTotal}>
                          ₹{item.price * item.quantity}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* TOTAL BREAKDOWN */}
                  <div className={styles.totalBox}>
                    {order.shippingFee !== undefined &&
                      order.shippingFee !== null && (
                        <div className={styles.subtotalRow}>
                          <span>Shipping Fee</span>
                          <span>
                            {order.shippingFee === 0
                              ? "FREE"
                              : `₹${order.shippingFee}`}
                          </span>
                        </div>
                      )}

                    <div className={styles.grandTotalRow}>
                      <span className={styles.grandTotalLabel}>
                        Total Amount:
                      </span>
                      <span className={styles.grandTotalValue}>
                        ₹{order.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── ADMIN STATUS ACTIONS ─── */}
              <div className={styles.actionsBar}>
                <span className={styles.actionsLabel}>
                  <FiTruck size={14} /> Update Fulfillment Status:
                </span>

                <div className={styles.actions}>
                  {STEPS.map((step) => {
                    const isSelected = order.orderStatus === step;
                    const isUpdating =
                      updatingOrderId === order._id && updatingStep === step;

                    return (
                      <button
                        key={step}
                        disabled={isSelected || updatingOrderId === order._id}
                        className={`${styles.actionBtn} ${
                          isSelected ? styles.active : ""
                        }`}
                        onClick={() => updateStatus(order._id, step)}
                      >
                        {isUpdating ? (
                          <FiLoader
                            size={12}
                            className={styles.spinning}
                          />
                        ) : isSelected ? (
                          <FiCheck size={12} />
                        ) : null}
                        {step}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}