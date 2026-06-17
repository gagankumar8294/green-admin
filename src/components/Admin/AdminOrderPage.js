"use client";

import { useEffect, useState, useMemo } from "react";
import styles from "./adminOrders.module.css";
import { API_BASE_URL } from "@/config/api";
import { FiLoader, FiAlertCircle, FiSearch, FiPackage, FiMapPin, FiCreditCard, FiChevronDown } from "react-icons/fi";

const STEPS = ["ORDERED", "SHIPPED", "PICKED", "ARRIVED", "DELIVERED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date-newest");

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/admin/orders`, {
      credentials: "include",
      headers: {
        "x-admin-authorization": "romeoPistol",
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setOrders(data.orders);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId, status) => {
    const res = await fetch(
      `${API_BASE_URL}/api/admin/orders/${orderId}/status`,
      {
        method: "PUT",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-authorization": "romeoPistol"
        },
        body: JSON.stringify({ orderStatus: status }),
      }
    );

    const data = await res.json();
    if (data.success) {
      setOrders(prev =>
        prev.map(o => (o._id === orderId ? data.order : o))
      );
    }
  };

  // Memoized filtered & sorted orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o._id?.toLowerCase().includes(q) ||
        o.address?.fullName?.toLowerCase().includes(q) ||
        o.address?.phone?.includes(q) ||
        o.address?.city?.toLowerCase().includes(q) ||
        o.user?.name?.toLowerCase().includes(q) ||
        o.user?.email?.toLowerCase().includes(q)
      );
    }

    if (paymentFilter !== "ALL") {
      result = result.filter(o => o.status === paymentFilter);
    }

    if (fulfillmentFilter !== "ALL") {
      result = result.filter(o => o.orderStatus === fulfillmentFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "date-newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "date-oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "amount-desc":
          return b.totalAmount - a.totalAmount;
        case "amount-asc":
          return a.totalAmount - b.totalAmount;
        default:
          return 0;
      }
    });

    return result;
  }, [orders, searchQuery, paymentFilter, fulfillmentFilter, sortBy]);

  if (loading) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Orders</h1>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "80px 20px", gap: "16px",
        }}>
          <FiLoader size={40} color="#10b981" style={{animation:"orders-spin 0.8s linear infinite"}} />
          <p style={{ color: "#6b7280", fontSize: "0.95rem", margin: 0 }}>Fetching orders from database...</p>
          <style>{`@keyframes orders-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Orders</h1>

      {/* SEARCH AND FILTERING CONTROLS */}
      <div className={styles.controlsRow}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by Order ID, Customer Name, Email, Phone, City..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.filterControl}>
            <label>Payment Status</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">All Payments</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className={styles.filterControl}>
            <label>Fulfillment Status</label>
            <select
              value={fulfillmentFilter}
              onChange={(e) => setFulfillmentFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">All Fulfillments</option>
              {STEPS.map((step) => (
                <option key={step} value={step}>
                  {step}
                </option>
              ))}
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
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className={styles.noOrders}>
          <FiAlertCircle size={36} color="#374151" style={{marginBottom:8}} />
          <p>No orders matched your search and filter criteria.</p>
        </div>
      ) : (
        filteredOrders.map(order => (
          <div key={order._id} className={styles.orderCard}>
            {/* HEADER */}
            <div className={styles.header}>
              <div>
                <h3>Order #{order._id}</h3>
                <p className={styles.time}>
                  Created: {new Date(order.createdAt).toLocaleString()}
                </p>
                <p className={styles.time}>
                  Updated: {new Date(order.updatedAt).toLocaleString()}
                </p>
              </div>

              <div className={styles.statusBox}>
                <span
                  className={`${styles.paymentStatus} ${
                    order.status === "PAID"
                      ? styles.paid
                      : order.status === "CANCELLED"
                      ? styles.cancelled
                      : styles.pending
                  }`}
                >
                  {order.status}
                </span>
                <span className={styles.orderStatus}>
                  {order.orderStatus}
                </span>
              </div>
            </div>

            {/* ADDRESS */}
            <div className={styles.section}>
              <h4><FiMapPin size={12} style={{marginRight:6}} />Delivery Address</h4>
              <p>{order.address?.fullName}</p>
              <p>{order.address?.phone}</p>
              <p>
                {order.address?.street}, {order.address?.city}
              </p>
              <p>
                {order.address?.state} – {order.address?.pincode}
              </p>
            </div>

            {/* ITEMS */}
            <div className={styles.section}>
              <h4><FiPackage size={12} style={{marginRight:6}} />Items</h4>
              <div className={styles.items}>
                {order.items.map((item, i) => (
                  <div key={i} className={styles.itemRow}>
                    <img src={item.image} alt={item.name} />
                    <div className={styles.itemInfo}>
                      <strong>{item.name}</strong>
                      <span>₹{item.price} × {item.quantity}</span>
                    </div>
                    <div className={styles.itemTotal}>
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PAYMENT */}
            <div className={styles.section}>
              <h4><FiCreditCard size={12} style={{marginRight:6}} />Payment Details</h4>
              <p>Razorpay Order ID: {order.payment?.razorpayOrderId || "-"}</p>
              <p>Payment ID: {order.payment?.razorpayPaymentId || "-"}</p>
              <p>Signature: {order.payment?.razorpaySignature || "-"}</p>
            </div>

            {/* TOTAL */}
            <div className={styles.total}>
              Total Amount: ₹{order.totalAmount}
            </div>

            {/* ADMIN CONTROLS */}
            <div className={styles.actions}>
              {STEPS.map(step => (
                <button
                  key={step}
                  disabled={order.orderStatus === step}
                  className={
                    order.orderStatus === step ? styles.active : ""
                  }
                  onClick={() => updateStatus(order._id, step)}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}