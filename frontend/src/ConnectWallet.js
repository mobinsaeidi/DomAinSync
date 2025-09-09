import React, { useState } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  MARKETPLACE_CONTRACT_ABI,
  MARKETPLACE_CONTRACT_ADDRESS
} from "./contractInfo";
import { fetchWhois } from "./utils/fetchWhois";
import WhoisCard from "./components/WhoisCard";

const SEPOLIA_CHAIN_ID = "0xaa36a7";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEPLOY_BLOCK = 9145927;

export default function ConnectWallet() {
  const [account, setAccount] = useState(null);
  const [owner, setOwner] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [domains, setDomains] = useState([]);
  const [whoisData, setWhoisData] = useState({});
  const [refreshingDomain, setRefreshingDomain] = useState(null);
  const [newDomainName, setNewDomainName] = useState("");
  const [newWhoisData, setNewWhoisData] = useState("");
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [domainListings, setDomainListings] = useState({});
  const [sellPrices, setSellPrices] = useState({});
  const [soldDomains, setSoldDomains] = useState([]);

  // بررسی صحت آدرس قرارداد marketplace
  const isValidMarketplaceAddress = () => {
    return MARKETPLACE_CONTRACT_ADDRESS && 
           MARKETPLACE_CONTRACT_ADDRESS.startsWith("0x") && 
           MARKETPLACE_CONTRACT_ADDRESS.length === 42 &&
           ethers.isAddress(MARKETPLACE_CONTRACT_ADDRESS);
  };

  // Wallet connect
  const connectWallet = async () => {
    try {
      if (!window.ethereum?.isMetaMask) {
        setError("⚠️ Please install and enable MetaMask.");
        return;
      }
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);

      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== SEPOLIA_CHAIN_ID) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID }]
        });
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const currentOwner = await contract.owner();
      setOwner(currentOwner);

      await fetchDomains();
    } catch (err) {
      setError(`❌ ${err.message || err}`);
    }
  };

  // Fetch domains & WHOIS
  const fetchDomains = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const filter = contract.filters.Transfer(ZERO_ADDRESS, null);
      const events = await contract.queryFilter(filter, DEPLOY_BLOCK, "latest");

      const domainList = [];
      for (const ev of events) {
        const tokenId = ev.args.tokenId.toString();
        try {
          const domainName = await contract.getDomainByTokenId(tokenId);
          domainList.push({ tokenId, domainName });
        } catch (err) {
          console.warn(`Could not get domain name for token ID ${tokenId}:`, err);
        }
      }
      setDomains(domainList);

      for (const d of domainList) {
        try {
          const fullDomain = d.domainName.includes(".") ? d.domainName : `${d.domainName}.com`;
          const data = await fetchWhois(fullDomain);
          setWhoisData((prev) => ({ ...prev, [d.domainName]: data }));
        } catch (err) {
          console.warn(`Could not fetch WHOIS for ${d.domainName}:`, err);
        }
      }

      await checkDomainListings(domainList);
    } catch (err) {
      setError(`❌ Error fetching domains: ${err.message}`);
    }
  };

  const checkDomainListings = async (domainList) => {
    if (!isValidMarketplaceAddress()) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const market = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ABI, provider);

      const newListings = {};
      const newPrices = {};
      
      for (const d of domainList) {
        try {
          const listing = await market.listings(d.tokenId);
          newListings[d.tokenId] = listing.seller !== ZERO_ADDRESS;
          if (newListings[d.tokenId]) {
            newPrices[d.tokenId] = ethers.formatEther(listing.price);
          }
        } catch (err) {
          console.warn(`Could not check listing for token ID ${d.tokenId}:`, err);
          newListings[d.tokenId] = false;
        }
      }
      setDomainListings(newListings);
      setSellPrices(newPrices);
    } catch (err) {
      console.error("Error checking domain listings:", err);
    }
  };

  const refreshWhois = async (domain) => {
    setRefreshingDomain(domain);
    try {
      const fullDomain = domain.includes(".") ? domain : `${domain}.com`;
      const data = await fetchWhois(fullDomain);
      setWhoisData((prev) => ({ ...prev, [domain]: data }));
    } catch (err) {
      setError(`❌ Error refreshing WHOIS: ${err.message}`);
    } finally {
      setRefreshingDomain(null);
    }
  };

  const handleRegister = async () => {
    if (!newDomainName.trim()) {
      setStatus("❌ Please enter a domain name.");
      return;
    }
    try {
      if (/^\d+(\.\d+)?$/.test(newDomainName.trim().toLowerCase()) || newDomainName.trim().toLowerCase() === "open") {
        setStatus("❌ Invalid domain name for registration.");
        return;
      }
      setStatus("⏳ Sending transaction...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const whoisHash = ethers.id(newWhoisData || "{}");
      const tx = await contract.registerDomain(newDomainName, whoisHash);
      await tx.wait();

      setStatus(`✅ Domain "${newDomainName}" registered successfully!`);
      setNewDomainName("");
      setNewWhoisData("");
      await fetchDomains();
    } catch (err) {
      setStatus(`❌ ${err.reason || err.message || "Unknown error during registration"}`);
    }
  };

  const listDomainForSale = async (tokenId, domainName, price) => {
    try {
      if (!isValidMarketplaceAddress()) {
        setStatus("❌ Marketplace contract address is not configured properly.");
        return;
      }
      if (!price || isNaN(price) || parseFloat(price) <= 0) {
        setStatus("❌ Please enter a valid price.");
        return;
      }
      setStatus(`⏳ Listing "${domainName}" for sale...`);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const market = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ABI, signer);
      const priceInWei = ethers.parseEther(price.toString());

      const domainContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const approveTx = await domainContract.approve(MARKETPLACE_CONTRACT_ADDRESS, tokenId);
      await approveTx.wait();

      const listTx = await market.listDomain(tokenId, priceInWei);
      await listTx.wait();

      setStatus(`✅ Domain "${domainName}" listed for sale successfully!`);
      setDomainListings(prev => ({ ...prev, [tokenId]: true }));
      setSellPrices(prev => ({ ...prev, [tokenId]: price }));
    } catch (err) {
      setStatus(`❌ ${err.reason || err.message || "Unknown error during listing"}`);
    }
  };

  const buyDomain = async (tokenId, domainName, price) => {
    try {
      if (!isValidMarketplaceAddress()) {
        setStatus("❌ Marketplace contract address is not configured properly.");
        return;
      }
      setStatus(`⏳ Buying "${domainName}" (ID: ${tokenId})...`);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const market = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ABI, signer);

      const listing = await market.listings(tokenId);
      if (listing.seller === ZERO_ADDRESS) {
        setStatus(`❌ Domain "${domainName}" is not for sale.`);
        return;
      }
      const priceWei = listing.price;
      const tx = await market.buyDomain(tokenId, { value: priceWei });
      await tx.wait();

      setStatus(`✅ Domain "${domainName}" purchased successfully!`);
      setSoldDomains(prev => [...prev, {
        domainName,
        tokenId,
        price: price || ethers.formatEther(priceWei),
        soldAt: new Date().toLocaleString()
      }]);
      setDomainListings(prev => ({ ...prev, [tokenId]: false }));
      setSellPrices(prev => {
        const newPrices = { ...prev };
        delete newPrices[tokenId];
        return newPrices;
      });
      await fetchDomains();
    } catch (err) {
      setStatus(`❌ ${err.reason || err.message || "Unknown error during purchase"}`);
    }
  };

  const handleTransferOwnership = async () => {
    if (!newOwnerAddress.trim()) {
      setStatus("❌ Please enter an Ethereum address.");
      return;
    }
    if (!ethers.isAddress(newOwnerAddress)) {
      setStatus("❌ Please enter a valid Ethereum address.");
      return;
    }
    if (newOwnerAddress.toLowerCase() === owner?.toLowerCase()) {
      setStatus("❌ New owner address is the same as current owner.");
      return;
    }
    if (owner?.toLowerCase() !== account?.toLowerCase()) {
      setStatus("❌ Only the current contract owner can transfer ownership.");
      return;
    }
    try {
      setStatus("⏳ Sending transaction...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const currentOwner = await contract.owner();
      if (currentOwner.toLowerCase() !== account.toLowerCase()) {
        setStatus("❌ You are not the contract owner.");
        return;
      }
      const tx = await contract.transferOwnership(newOwnerAddress);
      await tx.wait();
      const newOwner = await contract.owner();
      setOwner(newOwner);
      setStatus(`✅ Contract ownership transferred to ${newOwnerAddress}`);
      setNewOwnerAddress("");
    } catch (err) {
      setStatus(`❌ ${err.reason || err.message || "Unknown error during ownership transfer"}`);
    }
  };

  const isDomainForSale = (tokenId) => {
    return domainListings[tokenId] === true;
  };

  const SoldDomainsList = () => {
    if (soldDomains.length === 0) return null;
    return (
      <div style={{
        position: 'fixed', top: '20px', right: '20px',
        backgroundColor: '#f8f9fa', border: '1px solid #dee2e6',
        borderRadius: '8px', padding: '15px', maxWidth: '300px', maxHeight: '400px',
        overflowY: 'auto', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 1000
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>✅ Sold Domains</h4>
        {soldDomains.map((sold, index) => (
          <div key={index} style={{
            padding: '8px', margin: '5px 0', backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb', borderRadius: '4px'
          }}>
            <div><strong>{sold.domainName}</strong></div>
            <div>Price: {sold.price} ETH</div>
            <div style={{ fontSize: '0.8em', color: '#6c757d' }}>Sold: {sold.soldAt}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderOwnerPanel = () => {
    return (
      <div style={{ border: "1px solid #ccc", padding: "1rem", marginTop: "1rem" }}>
        <h3>🛠 Owner Control Panel</h3>
        <div>
          <input 
            placeholder="Domain Name" 
            value={newDomainName}
            onChange={(e) => setNewDomainName(e.target.value)}
            style={{ marginRight: "0.5rem", padding: "0.5rem" }}
          />
          <input 
            placeholder="Whois Data (Optional)" 
            value={newWhoisData}
            onChange={(e) => setNewWhoisData(e.target.value)}
            style={{ marginRight: "0.5rem", padding: "0.5rem" }}
          />
          <button onClick={handleRegister} style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}>
            📌 Register New Domain
          </button>
          {/* ZK Proof Button Placeholder */}
          <button
            className="btn btn-secondary"
            style={{ backgroundColor: '#888', color: '#fff', cursor: 'not-allowed', padding: "0.5rem 1rem" }}
            title="ZK Proof verification will be available soon"
            disabled
          >
            🔒 Verify Proof (ZK)
          </button>
        </div>
        <div style={{ marginTop: "0.5rem" }}>
          <input 
            placeholder="New Owner Address" 
            value={newOwnerAddress}
            onChange={(e) => setNewOwnerAddress(e.target.value)}
            style={{ marginRight: "0.5rem", padding: "0.5rem", width: "300px" }}
          />
          <button onClick={handleTransferOwnership} style={{ padding: "0.5rem 1rem" }}>
            🔑 Transfer Contract Ownership
          </button>
        </div>
      </div>
    );
  };

  const isOwner = owner && account && owner.toLowerCase() === account.toLowerCase();

  return (
    <div style={{ padding: "1rem", fontFamily: "Arial, sans-serif" }}>
      {account ? (
        <>
          <p>✅ Wallet Connected: {account}</p>
          {owner && (
            isOwner ? (
              <p style={{ color: "green" }}>🏆 Contract Owner: {owner} — You are the contract owner ✅</p>
            ) : (
              <p style={{ color: "orange" }}>📜 Contract Owner: {owner} — You are NOT the contract owner ⚠️</p>
            )
          )}
          {!isValidMarketplaceAddress() && (
            <p style={{ color: "red" }}>⚠️ Marketplace contract is not properly configured</p>
          )}
          <SoldDomainsList />
          <div>
            <h3>📜 Registered Domains</h3>
            {domains.length === 0 ? (
              <p>No domains registered yet.</p>
            ) : (
              domains.map((d) => (
                <div key={d.tokenId} style={{ marginBottom: "1rem", border: "1px solid #eee", padding: "1rem", borderRadius: "5px" }}>
                  <strong>{d.domainName} (Token ID: {d.tokenId})</strong>
                  <WhoisCard data={whoisData[d.domainName]} />
                  <button
                    onClick={() => refreshWhois(d.domainName)}
                    disabled={refreshingDomain === d.domainName}
                    style={{ marginRight: "0.5rem", padding: "0.5rem 1rem", backgroundColor: "#f0f0f0", border: "1px solid #ccc", borderRadius: "3px" }}
                  >
                    {refreshingDomain === d.domainName ? "Refreshing..." : "Refresh WHOIS"}
                  </button>
                  {isDomainForSale(d.tokenId) ? (
                    <div>
                      <p>💰 Price: {sellPrices[d.tokenId]} ETH</p>
                      <button 
                        onClick={() => buyDomain(d.tokenId, d.domainName, sellPrices[d.tokenId])} 
                        style={{ backgroundColor: "#4CAF50", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "3px" }}
                      >
                        💸 Buy Now
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: "0.5rem" }}>
                      <input 
                        placeholder="Price in ETH" 
                        value={sellPrices[d.tokenId] || ""}
                        onChange={(e) => setSellPrices(prev => ({ ...prev, [d.tokenId]: e.target.value }))}
                        style={{ width: "100px", marginRight: "0.5rem", padding: "0.5rem" }}
                      />
                      <button 
                        onClick={() => listDomainForSale(d.tokenId, d.domainName, sellPrices[d.tokenId])}
                        disabled={!sellPrices[d.tokenId] || isNaN(sellPrices[d.tokenId]) || parseFloat(sellPrices[d.tokenId]) <= 0}
                        style={{ padding: "0.5rem 1rem", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "3px" }}
                      >
                        📈 List for Sale
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          {isOwner && renderOwnerPanel()}
        </>
      ) : (
        <button onClick={connectWallet} style={{ padding: "0.5rem 1rem", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "3px" }}>
          Connect to MetaMask
        </button>
      )}
      {status && <p style={{ color: status.includes("❌") ? "red" : "blue", marginTop: "1rem", padding: "0.5rem", backgroundColor: status.includes("❌") ? "#ffe6e6" : "#e6f7ff", borderRadius: "3px" }}>{status}</p>}
      {error && <p style={{ color: "red", marginTop: "1rem", padding: "0.5rem", backgroundColor: "#ffe6e6", borderRadius: "3px" }}>{error}</p>}
    </div>
  );
}
