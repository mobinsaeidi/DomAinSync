import React from "react";

export default function LiveEvents({ events }) {
  if (!events || events.length === 0) {
    return <p>No blockchain events yet...</p>;
  }

  return (
    <div className="live-events">
      <h2>
        <span style={{ color: "#8B0000", fontWeight: "bold" }}>[LIVE]</span>{" "}
        Blockchain Events
      </h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {events.map((event, idx) => (
          <li
            key={idx}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "8px",
              borderRadius: "6px",
              backgroundColor: "#fff",
              color: "#000", // متن پیش‌فرض مشکی
            }}
          >
            <div style={{ marginBottom: "4px" }}>
              <strong>Type:</strong>{" "}
              {event.isMint ? (
                <span style={{ color: "#8B0000" }}>Domain Registration</span>
              ) : (
                <span>Transfer</span>
              )}
            </div>

            {/* Token ID */}
            <div>
              <strong>Token ID:</strong>{" "}
              <span style={{ color: "#8B0000", fontWeight: "bold" }}>
                {event.tokenId}
              </span>
            </div>

            {/* Domain Name */}
            {event.domainName && (
              <div>
                <strong>Domain Name:</strong>{" "}
                <span style={{ color: "#8B0000", fontWeight: "bold" }}>
                  {event.domainName}
                </span>
              </div>
            )}

            <div>
              <strong>From:</strong> <span>{event.from}</span>
            </div>
            <div>
              <strong>To:</strong> <span>{event.to}</span>
            </div>

            {/* Block */}
            <div>
              <strong>Block:</strong>{" "}
              <span
                style={{
                  backgroundColor: "#8B0000",
                  color: "#fff",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontWeight: "bold",
                }}
              >
                {event.blockNumber}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
