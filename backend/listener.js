// backend/listener.js
import { ethers } from "ethers";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { WebSocketServer } from "ws";

// ساپورت مسیر ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// بارگذاری env
dotenv.config({ path: path.join(__dirname, "../.env") });
const { SEPOLIA_WS_URL, CONTRACT_ADDRESS } = process.env;
if (!SEPOLIA_WS_URL || !CONTRACT_ADDRESS) {
  throw new Error("❌ SEPOLIA_WS_URL یا CONTRACT_ADDRESS در .env تنظیم نشده است");
}

// خواندن ABI
const abiPath = path.join(__dirname, "DomainDualIdentityABI.json");
const abi = JSON.parse(readFileSync(abiPath, "utf8"));

// اتصال WebSocket Provider
const provider = new ethers.WebSocketProvider(SEPOLIA_WS_URL);
console.log("🌐 Connected to Sepolia via WebSocket");

// ساخت اینستنس کانترکت
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// WebSocket Server برای ارسال رویداد به فرانت‌اند
const wss = new WebSocketServer({ port: 4001 });
wss.on("connection", () => console.log("📡 Frontend connected"));
const broadcast = (data) => {
  const json = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(json);
  });
};

// گرفتن events در بازه ۱۰ بلاک آخر برای پلن رایگان
async function sendHistory() {
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(latestBlock - 9, 0);
  console.log(`📜 Fetching history: blocks ${fromBlock} → ${latestBlock}`);

  try {
    const events = await contract.queryFilter("Transfer", fromBlock, latestBlock);
    console.log(`📜 Found ${events.length} historical events`);
    for (const ev of events) {
      await processEvent(ev.args[0], ev.args[1], ev.args[2], ev, false);
    }
  } catch (err) {
    console.error("❌ History fetch error:", err.message);
  }
}

// گوش دادن به رویدادهای زنده
function listenLive() {
  contract.on("Transfer", async (from, to, tokenId, event) => {
    await processEvent(from, to, tokenId, event, true);
  });
}

// پردازش هر رویداد
async function processEvent(from, to, tokenId, event, isLive) {
  let domainName = "";
  try {
    domainName = await contract.getDomainByTokenId(tokenId);
  } catch (err) {
    console.warn(`⚠️ Domain fetch failed for token ${tokenId}: ${err.message}`);
  }

  const isMint = from.toLowerCase() === ZERO_ADDRESS.toLowerCase();

  // گرفتن بلاک‌نامبر امن
  const blockNum = event.blockNumber ?? event.log?.blockNumber;
  let timestamp = null;
  try {
    const block = await provider.getBlock(blockNum);
    timestamp = block.timestamp;
  } catch (err) {
    console.warn(`⚠️ Could not fetch block ${blockNum}: ${err.message}`);
  }

  // لاگ در کنسول
  console.log(`\n[${isLive ? "LIVE" : "HISTORY"}] Block #${blockNum}`);
  console.log(`  From: ${from}`);
  console.log(`  To:   ${to}`);
  console.log(`  Token: ${tokenId.toString()}`);
  console.log(`  Domain: ${domainName}`);
  console.log(`  Mint event: ${isMint}`);
  if (timestamp) {
    console.log(`  Time: ${new Date(timestamp * 1000).toISOString()}`);
  }

  // ارسال به فرانت
  broadcast({
    from,
    to,
    tokenId: tokenId.toString(),
    blockNumber: blockNum,
    timestamp,
    domainName,
    isMint,
    isLive
  });
}

// شروع Listener
await sendHistory();
listenLive();
console.log("🚀 Listener running (history + live mode)");
