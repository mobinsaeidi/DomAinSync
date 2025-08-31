import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contractInfo";

const SEPOLIA_CHAIN_ID = "0xaa36a7"; // Sepolia
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEPLOY_BLOCK = 9103092; // Sepolia deployment block

export default function ConnectWallet() {
  const [account, setAccount] = useState(null);
  const [owner, setOwner] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [domains, setDomains] = useState([]);

  // === Connect Wallet ===
  const connectWallet = async () => {
    try {
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        setError("⚠️ Please install and enable MetaMask.");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);

      // Check & switch to Sepolia
      let chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: SEPOLIA_CHAIN_ID,
                  chainName: "Sepolia Test Network",
                  nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
                  rpcUrls: ["https://sepolia.infura.io/v3/"],
                  blockExplorerUrls: ["https://sepolia.etherscan.io"],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const ownerAddress = await contract.owner();
      setOwner(ownerAddress);

      // Fetch existing domains after connecting
      await fetchDomains();
    } catch (err) {
      console.error(err);
      setError(`❌ ${err.message || err}`);
    }
  };

  // === Fetch Registered Domains ===
  const fetchDomains = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const filter = contract.filters.Transfer(ZERO_ADDRESS, null);
      const events = await contract.queryFilter(filter, DEPLOY_BLOCK, "latest");

      const domainList = [];
      for (let ev of events) {
        const tokenId = ev.args.tokenId.toString();
        const domainName = await contract.getDomainByTokenId(tokenId);
        const whoisHash = await contract.getWhoisHash(domainName);
        domainList.push({
          tokenId,
          domainName,
          whoisHash,
        });
      }
      setDomains(domainList);
    } catch (err) {
      console.error("Error fetching domains:", err);
      setError(`❌ ${err.message || err}`);
    }
  };

  // === Register Domain ===
  const registerNewDomain = async (name, whoisData) => {
    try {
      setStatus("⏳ Sending transaction...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const whoisHash = ethers.id(whoisData); // keccak256 hash of string

      const tx = await contract.registerDomain(name, whoisHash);
      await tx.wait();
      setStatus(`✅ Domain "${name}" registered successfully!`);

      // Refresh domain list
      await fetchDomains();
    } catch (err) {
      setStatus(`❌ ${err.message || err}`);
    }
  };

  // === Transfer Ownership ===
  const transferContractOwnership = async (newOwnerAddress) => {
    try {
      setStatus("⏳ Sending transaction...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.transferOwnership(newOwnerAddress);
      await tx.wait();
      setStatus(`✅ Contract ownership transferred to ${newOwnerAddress}`);
      setOwner(newOwnerAddress);
    } catch (err) {
      setStatus(`❌ ${err.message || err}`);
    }
  };

  // === Owner Panel ===
  const renderOwnerPanel = () => {
    let domainNameInput, whoisInput, newOwnerInput;

    return (
      <div style={{ border: "1px solid #ccc", padding: "1rem", marginTop: "1rem" }}>
        <h3>🛠 Owner Control Panel</h3>

        {/* Register New Domain */}
        <div style={{ marginBottom: "0.5rem" }}>
          <input placeholder="Domain Name" ref={(el) => (domainNameInput = el)} />
          <input placeholder="Whois Data (string)" ref={(el) => (whoisInput = el)} />
          <button
            onClick={() =>
              registerNewDomain(domainNameInput.value, whoisInput.value)
            }
          >
            📌 Register New Domain
          </button>
        </div>

        {/* Transfer Ownership */}
        <div>
          <input placeholder="New Owner Address" ref={(el) => (newOwnerInput = el)} />
          <button onClick={() => transferContractOwnership(newOwnerInput.value)}>
            🔑 Transfer Contract Ownership
          </button>
        </div>
      </div>
    );
  };

  const isOwner =
    owner && account && owner.toLowerCase() === account.toLowerCase();

  return (
    <div>
      {account ? (
        <>
          <p>✅ Wallet Connected: {account}</p>
          {owner && (
            isOwner ? (
              <p style={{ color: "green" }}>
                🏆 Contract Owner: {owner} — You are the contract owner ✅
              </p>
            ) : (
              <p style={{ color: "orange" }}>
                📜 Contract Owner: {owner} — You are NOT the contract owner ⚠️
              </p>
            )
          )}

          {/* Domain List */}
          <div style={{ marginTop: "1rem" }}>
            <h3>📜 Registered Domains</h3>
            {domains.length > 0 ? (
              <ul>
                {domains.map((d) => (
                  <li key={d.tokenId}>
                    <strong>{d.domainName}</strong> — WHOIS: {d.whoisHash}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No domains found yet.</p>
            )}
          </div>

          {isOwner && renderOwnerPanel()}
        </>
      ) : (
        <button onClick={connectWallet}>Connect to MetaMask</button>
      )}

      {status && <p style={{ color: "blue" }}>{status}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
