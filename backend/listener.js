import { ethers } from "ethers";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { WebSocketServer } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

if (!process.env.SEPOLIA_RPC_URL) throw new Error("🚨 SEPOLIA_RPC_URL not set in .env");
if (!process.env.CONTRACT_ADDRESS) throw new Error("🚨 CONTRACT_ADDRESS not set in .env");

// خواندن ABI
const abiPath = path.join(__dirname, "./DomainDualIdentityABI.json");
const abi = JSON.parse(readFileSync(abiPath, "utf8"));

// اتصال به RPC
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
console.log(`🌐 Connected to Sepolia`);

// قرارداد
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);

// WebSocket server
const wss = new WebSocketServer({ port: 4001 });
wss.on("connection", () => {
  console.log("🌐 Frontend connected to WebSocket");
});

// ارسال به همه کلاینت‌ها
function broadcast(data) {
  const jsonData = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(jsonData);
  });
}

// 📜 ارسال رویدادهای تاریخچه
async function sendHistory() {
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(latestBlock - 2000, 0);
  const events = await contract.queryFilter("Transfer", fromBlock, latestBlock);

  console.log(`📜 Found ${events.length} past Transfer events`);
  
  const lastEvents = events.slice(-20); // فقط ۲۰ تای آخر
  for (const ev of lastEvents) {
    try {
      const domainName = await contract.getDomainByTokenId(ev.args[2]);
      const block = await provider.getBlock(ev.blockNumber); // گرفتن timestamp دقیق
      broadcast({
        from: ev.args[0],
        to: ev.args[1],
        tokenId: ev.args[2].toString(),
        blockNumber: ev.blockNumber,
        timestamp: block.timestamp,
        domainName
      });
    } catch (err) {
      console.error("❌ Error fetching domain name:", err.message);
    }
  }
}

// 🎯 گوش دادن Live
function listenLive() {
  contract.on("Transfer", async (from, to, tokenId, event) => {
    try {
      const block = await provider.getBlock(event.blockNumber);
      const domainName = await contract.getDomainByTokenId(tokenId);

      console.log("------ New Event Detected ------");
      console.log("From:", from);
      console.log("To:", to);
      console.log("Token ID:", tokenId.toString());
      console.log("Block:", event.blockNumber);
      console.log("Timestamp:", new Date(block.timestamp * 1000).toISOString());
      console.log("🌐 Domain Name:", domainName);

      broadcast({
        from,
        to,
        tokenId: tokenId.toString(),
        blockNumber: event.blockNumber,
        timestamp: block.timestamp,
        domainName
      });
    } catch (err) {
      console.error("❌ Error fetching domain name:", err.message);
    }
  });
}

// شروع کار
await sendHistory();
listenLive();

console.log("🚀 Listener is running... (history sent, live mode active)");
