import React, { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contractInfo";

// گرفتن provider مخصوص متامسک
function getMetaMaskProvider() {
  if (window.ethereum && window.ethereum.providers) {
    return window.ethereum.providers.find((p) => p.isMetaMask);
  } else if (window.ethereum && window.ethereum.isMetaMask) {
    return window.ethereum;
  }
  return null;
}

function ConnectWallet() {
  const [account, setAccount] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState(null);

  async function connect() {
    const provider = getMetaMaskProvider();
    if (!provider) {
      alert("MetaMask پیدا نشد! لطفاً مطمئن شو فعال هست یا افزونه‌های دیگر خاموش باشند.");
      return;
    }

    try {
      // اتصال به اکانت
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);

      // ساخت provider برای ethers
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      // ساخت نمونه قرارداد با signer
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // خواندن تابع view
      const owner = await contract.owner(); // اگه اسمش چیز دیگه‌ست، همینجا عوضش کن
      setOwnerAddress(owner);

    } catch (error) {
      console.error("خطا در اتصال یا خواندن قرارداد:", error);
    }
  }

  return (
    <div>
      {account ? (
        <div>
          <p>متصل شد: {account}</p>
          {ownerAddress && <p>صاحب قرارداد: {ownerAddress}</p>}
        </div>
      ) : (
        <button onClick={connect}>اتصال به متامسک</button>
      )}
    </div>
  );
}

export default ConnectWallet;
