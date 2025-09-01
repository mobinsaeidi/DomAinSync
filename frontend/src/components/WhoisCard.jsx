import React from "react";

function WhoisCard({ data }) {
  if (!data) return null;

  const {
    domainName,
    registrar,
    registrantCountry,
    registryRegistrationExpirationDate,
    updatedDate
  } = data;

  return (
    <div style={{
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "10px",
      margin: "10px 0",
      textAlign: "left",
      background: "#f9f9f9"
    }}>
      <h3>WHOIS Info</h3>
      <p><strong>Domain:</strong> {domainName}</p>
      <p><strong>Registrar:</strong> {registrar}</p>
      <p><strong>Country:</strong> {registrantCountry}</p>
      <p><strong>Expiry Date:</strong> {new Date(registryRegistrationExpirationDate).toLocaleString()}</p>
      <p><strong>Last Updated:</strong> {new Date(updatedDate).toLocaleString()}</p>
    </div>
  );
}

export default WhoisCard;
