import React from "react";

function formatDate(dateString) {
  if (!dateString) return null;
  const cleaned = dateString.replace(/\+0000$/, "Z");
  const date = new Date(cleaned);
  return isNaN(date) ? null : date.toLocaleString();
}

export default function WhoisCard({ data }) {
  if (!data) return null;

 
  const expiry =
    data.registryRegistrationExpirationDate ||
    data.registryExpiryDate ||
    data.expirationDate ||
    data.registryExpDate ||
    data.expires;

  const updated =
    data.updatedDate ||
    data.registryUpdatedDate ||
    data.lastUpdated ||
    data.updated;

  return (
    <div className="whois-card" style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
      <p><strong>Domain:</strong> {data.domainName || "N/A"}</p>
      <p><strong>Registrar:</strong> {data.registrar || "N/A"}</p>
      <p><strong>Country:</strong> {data.registrantCountry || "N/A"}</p>
      <p><strong>Expiry Date:</strong> {formatDate(expiry) || "N/A"}</p>
      <p><strong>Last Updated:</strong> {formatDate(updated) || "N/A"}</p>
    </div>
  );
}
