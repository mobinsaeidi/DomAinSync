import React, { useEffect, useState } from "react";
import ConnectWallet from "./ConnectWallet";
import "./App.css";
import { fetchWhois } from "./utils/fetchWhois";
import WhoisCard from "./components/WhoisCard";

function App() {
  const [whoisData, setWhoisData] = useState(null);

  useEffect(() => {
    async function loadWhois() {
      const data = await fetchWhois("google.com");
      setWhoisData(data);
    }
    loadWhois();
  }, []);

  return (
    <div className="App">
      <h1>DomainSync Dapp</h1>
      <ConnectWallet />
      <h2>WHOIS تست</h2>
      <WhoisCard data={whoisData} />
    </div>
  );
}

export default App;
