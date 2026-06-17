"use client";
import React, { useState, useEffect } from "react";
import styles from "./AdminShippingSettings.module.css";
import { API_BASE_URL } from "@/config/api";
import { FiLoader, FiSave, FiTruck, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

export default function AdminShippingSettings() {
  const [minOrder, setMinOrder] = useState(1000);
  const [shippingFee, setShippingFee] = useState(79);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings/shipping`, {
          credentials: "include",
          headers: {
            "x-admin-authorization": "romeoPistol",
          },
        });
        const data = await res.json();
        if (data.success && data.settings?.value) {
          setMinOrder(data.settings.value.minOrderForFreeShipping ?? 1000);
          setShippingFee(data.settings.value.defaultShippingFee ?? 79);
        }
      } catch (err) {
        console.error("Error fetching shipping settings:", err);
        setError("Failed to load shipping settings");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/shipping`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-authorization": "romeoPistol"
        },
        credentials: "include",
        body: JSON.stringify({
          value: {
            minOrderForFreeShipping: Number(minOrder),
            defaultShippingFee: Number(shippingFee),
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("✅ Shipping settings updated successfully!");
      } else {
        setError(data.message || "Failed to update settings");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.settingsWrapper} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 20px',gap:'16px'}}>
        <FiLoader size={36} color="#10b981" style={{animation:'spin 0.8s linear infinite'}} />
        <p style={{color:'#6b7280',margin:0}}>Loading shipping settings...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className={styles.settingsWrapper}>
      <h2 className={styles.title}><FiTruck size={18} style={{marginRight:8}} />Shipping Fee Configurations</h2>
      <p className={styles.description}>
        Set the minimum order value required for free delivery and configure the flat rate shipping fee applied to orders below that threshold.
      </p>

      {message && <div className={styles.successMessage}><FiCheckCircle size={15} style={{marginRight:6}} />{message}</div>}
      {error && <div className={styles.errorMessage}><FiAlertCircle size={15} style={{marginRight:6}} />{error}</div>}

      <form onSubmit={handleSave} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="minOrder">
            Free Shipping Minimum Threshold (₹)
          </label>
          <input
            id="minOrder"
            type="number"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            min="0"
            required
          />
          <small>Orders at or above this amount will get free shipping.</small>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="shippingFee">
            Flat Shipping Charge (₹)
          </label>
          <input
            id="shippingFee"
            type="number"
            value={shippingFee}
            onChange={(e) => setShippingFee(e.target.value)}
            min="0"
            required
          />
          <small>Flat fee applied to orders below the free shipping threshold.</small>
        </div>

        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? <><FiLoader size={14} style={{marginRight:6,animation:'spin 0.8s linear infinite'}} />Saving...</> : <><FiSave size={14} style={{marginRight:6}} />Save Settings</>}
        </button>
      </form>
    </div>
  );
}
