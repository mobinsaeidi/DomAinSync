import React, { useEffect, useState } from "react";
import ConnectWallet from "./ConnectWallet";
import "./App.css";
import { fetchWhois } from "./utils/fetchWhois";
import WhoisCard from "./components/WhoisCard";

function App() {
  const [whoisData, setWhoisData] = useState(null);

 
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function loadWhois() {
      const data = await fetchWhois("google.com");
      setWhoisData(data);
    }
    loadWhois();
  }, []);

  
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4001");

    ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data);

        
        setEvents((prev) => {
          const isDuplicate = prev.some(
            (e) => e.tokenId === event.tokenId && e.blockNumber === event.blockNumber
          );
          if (isDuplicate) return prev;

          return [
            ...prev,
            {
              ...event,
              type: Date.now() - performance.timing.navigationStart < 5000 ? "history" : "live"
            }
          ];
        });
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="App">
      <h1>DomainSync Dapp</h1>
      <ConnectWallet />

      <h2>WHOIS تست</h2>
      <WhoisCard data={whoisData} />

      <h2>📡 Live Blockchain Events</h2>
      <ul>
        {events.map((e, i) => (
          <li
            key={`${e.tokenId}-${e.blockNumber}-${i}`}
            style={{
              color: e.type === "history" ? "#888" : "#0f0", 
              fontWeight: e.type === "live" ? "bold" : "normal"
            }}
          >
            [{e.type.toUpperCase()}] Token ID: {e.tokenId} — Domain: {e.domainName} — From:{" "}
            {e.from} To: {e.to} — Block: {e.blockNumber}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
