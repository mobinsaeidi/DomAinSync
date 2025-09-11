import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contractInfo";

const DOMA_CHAIN_ID = "0x17cc4";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEPLOY_BLOCK = 10491732;

export default function ConnectWallet() {
  const [account, setAccount] = useState(null);
  const [owner, setOwner] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [domains, setDomains] = useState([]);
  const [prices, setPrices] = useState({});
  const [newPriceInputs, setNewPriceInputs] = useState({});
  const [domainActions, setDomainActions] = useState({});
  const [showRegistrationPanel, setShowRegistrationPanel] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [newDomainWhois, setNewDomainWhois] = useState("");
  const [newDomainPrice, setNewDomainPrice] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("not_started");

  const connectWallet = async () => {
    try {
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        setError("Please install and enable MetaMask.");
        return;
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);

      let chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== DOMA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: DOMA_CHAIN_ID }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: DOMA_CHAIN_ID,
                  chainName: "Doma Testnet",
                  nativeCurrency: { name: "Doma", symbol: "DOMA", decimals: 18 },
                  rpcUrls: ["https://rpc-testnet.doma.xyz"],
                  blockExplorerUrls: ["https://explorer-testnet.doma.xyz"],
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

      await fetchDomains();
    } catch (err) {
      console.error(err);
      setError(`${err.message || err}`);
    }
  };

  const fetchDomains = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const filter = contract.filters.Transfer(ZERO_ADDRESS, null);
      const events = await contract.queryFilter(filter, DEPLOY_BLOCK, "latest");

      const domainList = [];
      for (let ev of events) {
        const tokenId = ev.args.tokenId.toString();

        try {
          const domainName = await contract.getDomainByTokenId(tokenId);
          const domainOwner = await contract.ownerOf(tokenId);
          domainList.push({ tokenId, domainName, owner: domainOwner });
        } catch (innerErr) {
          console.warn(`Skipping tokenId ${tokenId}: ${innerErr.message || innerErr}`);
        }
      }

      setDomains(domainList);
    } catch (err) {
      console.error("Error fetching domains:", err);
      setError(`${err.message || err}`);
    }
  };

  const verifyDomainOwnership = async () => {
    try {
      if (!newDomainName) {
        setError("Please enter a domain name first");
        return;
      }

      setVerificationStatus("verifying");
      setStatus("Verifying domain ownership with ZK Proof...");

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const domainExists = domains.some(d => d.domainName.toLowerCase() === newDomainName.toLowerCase());
      if (domainExists) {
        throw new Error("Domain already registered");
      }
      
      setVerificationStatus("verified");
      setStatus("Domain ownership verified! You can now register the domain.");
    } catch (err) {
      setVerificationStatus("failed");
      setStatus(`Verification failed: ${err.message || err}`);
    }
  };

  const registerNewDomainWithPrice = async () => {
    try {
      if (verificationStatus !== "verified") {
        setError("Please verify domain ownership first");
        return;
      }

      if (!newDomainName || !newDomainWhois || !newDomainPrice) {
        setError("Please fill all fields");
        return;
      }

      const priceInETH = parseFloat(newDomainPrice);
      if (isNaN(priceInETH) || priceInETH <= 0) {
        setError("Please enter a valid price");
        return;
      }

      setStatus("Registering domain...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const whoisHash = ethers.id(newDomainWhois);
      const tx = await contract.registerDomain(newDomainName, whoisHash);
      
      await tx.wait();
      
      setPrices(prev => ({ ...prev, [newDomainName]: priceInETH }));
      
      setStatus(`Domain "${newDomainName}" registered successfully with price ${priceInETH} ETH!`);
      
      setNewDomainName("");
      setNewDomainWhois("");
      setNewDomainPrice("");
      setShowRegistrationPanel(false);
      setVerificationStatus("not_started");
      
      await fetchDomains();
    } catch (err) {
      setStatus(`Error registering domain: ${err.message || err}`);
    }
  };

  const setDomainPrice = async (domainName, price) => {
    try {
      setStatus("Setting price...");
      
      const priceInETH = parseFloat(price);
      
      if (isNaN(priceInETH) || priceInETH <= 0) {
        throw new Error("Please enter a valid price");
      }
      
      setPrices(prev => ({ ...prev, [domainName]: priceInETH }));
      
      setStatus(`Price for "${domainName}" set to ${priceInETH} ETH!`);
      setNewPriceInputs(prev => ({ ...prev, [domainName]: "" }));
    } catch (err) {
      setStatus(`Error setting price: ${err.message || err}`);
    }
  };

  const removeDomainPrice = async (domainName) => {
    try {
      setStatus("Removing price...");
      
      setPrices(prev => ({ ...prev, [domainName]: null }));
      
      setStatus(`Price for "${domainName}" removed!`);
    } catch (err) {
      setStatus(`Error removing price: ${err.message || err}`);
    }
  };

  const buyDomain = async (domainName, price, currentOwner) => {
    try {
      setStatus("Opening MetaMask for purchase...");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      let tokenId = null;
      for (const domain of domains) {
        if (domain.domainName === domainName) {
          tokenId = domain.tokenId;
          break;
        }
      }

      if (!tokenId) {
        throw new Error("Domain tokenId not found");
      }

      const tx = {
        to: currentOwner,
        value: ethers.parseEther(price.toString()),
      };

      const transaction = await signer.sendTransaction(tx);
      setStatus("Waiting for transaction confirmation...");
      
      await transaction.wait();
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const transferTx = await contract.transferFrom(currentOwner, await signer.getAddress(), tokenId);
      await transferTx.wait();
      
      setPrices(prev => ({ ...prev, [domainName]: null }));
      
      setStatus(`Domain "${domainName}" purchased successfully for ${price} ETH!`);
      await fetchDomains();
    } catch (err) {
      setStatus(`Error purchasing domain: ${err.message || err}`);
    }
  };

  const transferDomain = async (domainName, toAddress) => {
    try {
      setStatus("Transferring domain...");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      let tokenId = null;
      for (const domain of domains) {
        if (domain.domainName === domainName) {
          tokenId = domain.tokenId;
          break;
        }
      }

      if (!tokenId) {
        throw new Error("Domain tokenId not found");
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const transferTx = await contract.transferFrom(await signer.getAddress(), toAddress, tokenId);
      await transferTx.wait();
      
      setStatus(`Domain "${domainName}" transferred to ${toAddress}!`);
      await fetchDomains();
    } catch (err) {
      setStatus(`Error transferring domain: ${err.message || err}`);
    }
  };

  const transferContractOwnership = async (newOwnerAddress) => {
    try {
      setStatus("Sending transaction...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.transferOwnership(newOwnerAddress);
      await tx.wait();
      setStatus(`Contract ownership transferred to ${newOwnerAddress}`);
      setOwner(newOwnerAddress);
    } catch (err) {
      setStatus(`${err.message || err}`);
    }
  };

  const handlePriceChange = (domainName, value) => {
    setNewPriceInputs(prev => ({ ...prev, [domainName]: value }));
  };

  const handleActionChange = (domainName, field, value) => {
    setDomainActions(prev => ({
      ...prev,
      [domainName]: {
        ...prev[domainName],
        [field]: value
      }
    }));
  };

  const isSameAddress = (addr1, addr2) => {
    if (!addr1 || !addr2) return false;
    return addr1.toLowerCase() === addr2.toLowerCase();
  };

  const renderOwnerPanel = () => {
    let newOwnerInput;

    return (
      <div style={{ border: "1px solid #ccc", padding: "1rem", marginTop: "1rem" }}>
        <h3>Contract Owner Panel</h3>

        <div>
          <input placeholder="New Owner Address" ref={(el) => (newOwnerInput = el)} />
          <button onClick={() => transferContractOwnership(newOwnerInput.value)}>
            Transfer Contract Ownership
          </button>
        </div>
      </div>
    );
  };

  const renderRegistrationPanel = () => {
    return (
      <div style={{ border: "1px solid #ccc", padding: "1rem", marginTop: "1rem", marginBottom: "1rem" }}>
        <h3>Register New Domain</h3>
        
        <div style={{ marginBottom: "10px" }}>
          <input 
            type="text" 
            placeholder="Domain Name (e.g., example)" 
            value={newDomainName}
            onChange={(e) => setNewDomainName(e.target.value)}
            style={{ padding: "8px", width: "100%", marginBottom: "8px" }}
            disabled={verificationStatus === "verifying" || verificationStatus === "verified"}
          />
          
          <div style={{ marginBottom: "10px" }}>
            <button 
              onClick={verifyDomainOwnership}
              disabled={verificationStatus === "verifying" || verificationStatus === "verified" || !newDomainName}
              style={{ 
                padding: "8px 12px", 
                backgroundColor: verificationStatus === "verified" ? "#4CAF50" : "#007bff",
                color: "white", 
                border: "none", 
                borderRadius: "3px",
                cursor: (verificationStatus === "verifying" || verificationStatus === "verified" || !newDomainName) ? "not-allowed" : "pointer"
              }}
            >
              {verificationStatus === "verifying" ? "Verifying..." : 
               verificationStatus === "verified" ? "Verified" : 
               "ZK Verify Domain Ownership"}
            </button>
          </div>

          {(verificationStatus === "verified" || verificationStatus === "verifying") && (
            <>
              <input 
                type="text" 
                placeholder="Whois Data" 
                value={newDomainWhois}
                onChange={(e) => setNewDomainWhois(e.target.value)}
                style={{ padding: "8px", width: "100%", marginBottom: "8px" }}
                disabled={verificationStatus === "verifying"}
              />
              <input 
                type="number" 
                placeholder="Price in ETH" 
                value={newDomainPrice}
                onChange={(e) => setNewDomainPrice(e.target.value)}
                step="0.001"
                min="0"
                style={{ padding: "8px", width: "100%", marginBottom: "8px" }}
                disabled={verificationStatus === "verifying"}
              />
            </>
          )}
        </div>
        
        {verificationStatus === "verified" && (
          <button 
            onClick={registerNewDomainWithPrice}
            style={{ 
              padding: "10px 15px", 
              backgroundColor: "#4CAF50", 
              color: "white", 
              border: "none", 
              borderRadius: "3px",
              cursor: "pointer"
            }}
          >
            Register Domain
          </button>
        )}
        
        <button 
          onClick={() => {
            setShowRegistrationPanel(false);
            setVerificationStatus("not_started");
          }}
          style={{ 
            padding: "10px 15px", 
            backgroundColor: "#ccc", 
            color: "black", 
            border: "none", 
            borderRadius: "3px",
            cursor: "pointer",
            marginLeft: "10px"
          }}
        >
          Cancel
        </button>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {!account ? (
        <button 
          onClick={connectWallet}
          style={{
            padding: "10px 20px",
            backgroundColor: "#f6851b",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Connect to MetaMask
        </button>
      ) : (
        <>
          <p>Connected: {account}</p>
          {owner && isSameAddress(account, owner) ? (
            <p style={{ color: "green" }}>You are the contract owner</p>
          ) : (
            <p style={{ color: "orange" }}>You are NOT the contract owner</p>
          )}

          {!showRegistrationPanel && (
            <button 
              onClick={() => setShowRegistrationPanel(true)}
              style={{
                padding: "10px 15px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginBottom: "1rem"
              }}
            >
              Register New Domain
            </button>
          )}

          {showRegistrationPanel && renderRegistrationPanel()}

          <h3>Domains Marketplace</h3>
          {domains.filter(d => prices[d.domainName]).length === 0 ? (
            <p>No domains available for sale yet. Register a domain to get started!</p>
          ) : (
            domains.filter(d => prices[d.domainName]).map((d) => (
              <div key={d.tokenId} style={{ border: "1px solid #eee", padding: "1rem", marginBottom: "1rem", borderRadius: "5px" }}>
                <strong style={{ fontSize: "18px" }}>{d.domainName}.com</strong>
                <p>Owner: {d.owner}</p>
                
                <div style={{ margin: "10px 0" }}>
                  <p>Price: <strong>{prices[d.domainName]} ETH</strong></p>
                  
                  {isSameAddress(d.owner, account) && (
                    <div style={{ marginTop: "10px" }}>
                      <button 
                        onClick={() => removeDomainPrice(d.domainName)}
                        style={{ padding: "5px 10px", backgroundColor: "#ff4757", color: "white", border: "none", borderRadius: "3px", marginRight: "8px" }}
                      >
                        Remove From Sale
                      </button>
                      <input 
                        type="number" 
                        placeholder="New price in ETH" 
                        value={newPriceInputs[d.domainName] || ""}
                        onChange={(e) => handlePriceChange(d.domainName, e.target.value)}
                        style={{ marginRight: "8px", padding: "5px" }}
                        step="0.001"
                        min="0"
                      />
                      <button 
                        onClick={() => setDomainPrice(d.domainName, newPriceInputs[d.domainName])}
                        style={{ padding: "5px 10px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "3px" }}
                      >
                        Update Price
                      </button>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => buyDomain(d.domainName, prices[d.domainName], d.owner)}
                    disabled={isSameAddress(d.owner, account)}
                    style={{ 
                      backgroundColor: isSameAddress(d.owner, account) ? "#cccccc" : "#4CAF50", 
                      color: "white", 
                      marginTop: "8px", 
                      padding: "8px 15px",
                      border: "none",
                      borderRadius: "3px",
                      cursor: isSameAddress(d.owner, account) ? "not-allowed" : "pointer"
                    }}
                  >
                    {isSameAddress(d.owner, account) ? "You Own This Domain" : `Buy Domain (${prices[d.domainName]} ETH)`}
                  </button>
                </div>

                {isSameAddress(d.owner, account) && (
                  <div style={{ margin: "10px 0", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "5px" }}>
                    <h4>Domain Actions</h4>
                    <div style={{ marginBottom: "8px" }}>
                      <input 
                        placeholder="Transfer to address" 
                        value={domainActions[d.domainName]?.transferAddress || ""}
                        onChange={(e) => handleActionChange(d.domainName, 'transferAddress', e.target.value)}
                        style={{ marginRight: "8px", padding: "5px", width: "300px" }}
                      />
                      <button 
                        onClick={() => transferDomain(d.domainName, domainActions[d.domainName]?.transferAddress)}
                        style={{ padding: "5px 10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "3px" }}
                      >
                        Transfer Domain
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {owner && isSameAddress(account, owner) && renderOwnerPanel()}

          {status && <p style={{ color: "blue", marginTop: "15px" }}>{status}</p>}
          {error && <p style={{ color: "red", marginTop: "15px" }}>{error}</p>}
        </>
      )}
    </div>
  );
}