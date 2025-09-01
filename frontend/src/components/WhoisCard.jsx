import React, { useEffect } from "react";

function findDateInObject(obj) {
  if (!obj || typeof obj !== "object") return null;

  for (const key in obj) {
    if (!Object.hasOwn(obj, key)) continue;

    const value = obj[key];

    if (typeof value === "string") {
      if (
        /^\d{4}-\d{2}-\d{2}/.test(value) ||
        value.includes("GMT") ||
        value.includes("UTC")
      ) {
        return value;
      }
    }

    if (typeof value === "object") {
      const nested = findDateInObject(value);
      if (nested) return nested;
    }
  }
  return null;
}

function formatDate(dateString) {
  if (!dateString) return null;
  const cleaned = dateString.replace(/\+0000$/, "Z").trim();
  const date = new Date(cleaned);

  if (!isNaN(date)) return date.toLocaleString();

  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`).toLocaleDateString();
  }
  return dateString;
}

// رنگ وضعیت Expiry
function getExpiryStatusColor(expiryDateString) {
  if (!expiryDateString) return "#999";
  const expiryDate = new Date(expiryDateString);
  if (isNaN(expiryDate)) return "#999";

  const today = new Date();
  const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays > 60) return "#2ecc71"; // سبز
  if (diffDays > 0) return "#e67e22";  // نارنجی
  return "#e74c3c"; // قرمز
}

// کامپوننت Badge برای نمایش Expiry
function StatusBadge({ date }) {
  return (
    <span
      style={{
        backgroundColor: getExpiryStatusColor(date),
        color: "#fff",
        padding: "2px 6px",
        borderRadius: "4px",
        fontSize: "0.85em",
        fontWeight: "bold",
      }}
    >
      {formatDate(date) || "N/A"}
    </span>
  );
}

export default function WhoisCard({ data }) {
  useEffect(() => {
    if (data) {
      console.log("WHOIS Raw Data for", data.domainName, data);
    }
  }, [data]);

  if (!data) return null;

  const expiry =
    data.registryRegistrationExpirationDate ||
    data.registryExpiryDate ||
    data.expirationDate ||
    data.registryExpDate ||
    data.expires ||
    data.expiry ||
    data.domainExpiration ||
    findDateInObject(data);

  const updated =
    data.updatedDate ||
    data.registryUpdatedDate ||
    data.lastUpdated ||
    data.updated ||
    findDateInObject(data);

  return (
    <div
      className="whois-card"
      style={{
        border: "1px solid #ccc",
        padding: "10px",
        marginBottom: "10px",
        borderRadius: "6px"
      }}
    >
      <p><strong>Domain:</strong> {data.domainName || "N/A"}</p>
      <p><strong>Registrar:</strong> {data.registrar || "N/A"}</p>
      <p><strong>Country:</strong> {data.registrantCountry || "N/A"}</p>
      <p>
        <strong>Expiry Date:</strong> <StatusBadge date={expiry} />
      </p>
      <p><strong>Last Updated:</strong> {formatDate(updated) || "N/A"}</p>
    </div>
  );
}
