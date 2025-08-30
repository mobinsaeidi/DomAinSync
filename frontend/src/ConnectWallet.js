import React, { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contractInfo";

export default function ConnectWallet() {
  const [walletAddress, setWalletAddress] = useState("");
  const [contractName, setContractName] = useState("");

  // اتصال به متامسک
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Metamask not found! Please install it.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWalletAddress(accounts[0]);
      await getContractName();
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  // خواندن متد name() از قرارداد
  const getContractName = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const name = await contract.name();
      setContractName(name);
    } catch (error) {
      console.error("Error reading contract name:", error);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>DomainSync Frontend</h2>
      {walletAddress ? (
        <>
          <p>Connected Wallet: {walletAddress}</p>
          <p>Contract Name: {contractName}</p>
        </>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
}
