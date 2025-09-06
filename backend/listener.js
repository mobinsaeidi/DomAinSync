// backend/listener.js
import { ethers } from "ethers";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { WebSocketServer } from "ws";

// ===== تنظیمات =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const { SEPOLIA_WS_URL, CONTRACT_ADDRESS } = process.env;
if (!SEPOLIA_WS_URL || !CONTRACT_ADDRESS) {
  throw new Error("❌ SEPOLIA_WS_URL یا CONTRACT_ADDRESS در .env تنظیم نشده");
}

// ===== ABI و Provider =====
const abiPath = path.join(__dirname, "DomainDualIdentityABI.json");
const abi = JSON.parse(readFileSync(abiPath, "utf8"));

const provider = new ethers.WebSocketProvider(SEPOLIA_WS_URL);
console.log("🌐 Connected to Sepolia WebSocket");

const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// ===== WebSocket Server برای فرانت =====
const wss = new WebSocketServer({ port: 4001 });
wss.on("connection", () => console.log("📡 Frontend connected"));
const broadcast = (data) => {
  const json = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(json);
  });
};

// ===== گرفتن بلاک با سه روش =====
async function getBlockDetailsFromEvent(event) {
  try {
    // 1️⃣ از event.log
    if (event?.log?.blockNumber) {
      const block = await provider.getBlock(event.log.blockNumber);
      return { blockNum: event.log.blockNumber, timestamp: block?.timestamp ?? null };
    }

    // 2️⃣ از getTransaction
    if (event?.transactionHash) {
      const tx = await provider.getTransaction(event.transactionHash);
      if (tx?.blockNumber) {
        const block = await provider.getBlock(tx.blockNumber);
        return { blockNum: tx.blockNumber, timestamp: block?.timestamp ?? null };
      }
    }

    // 3️⃣ از getTransactionReceipt
    if (event?.transactionHash) {
      const receipt = await provider.getTransactionReceipt(event.transactionHash);
      if (receipt?.blockNumber) {
        const block = await provider.getBlock(receipt.blockNumber);
        return { blockNum: receipt.blockNumber, timestamp: block?.timestamp ?? null };
      }
    }

    return { blockNum: null, timestamp: null };

  } catch (err) {
    console.warn(`⚠️ Block fetch failed: ${err.message}`);
    return { blockNum: null, timestamp: null };
  }
}

// ===== History =====
async function sendHistory() {
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(latestBlock - 2000, 0); 
  console.log(`📜 Fetching history: blocks ${fromBlock} → ${latestBlock}`);

  try {
    const events = await contract.queryFilter("Transfer", fromBlock, latestBlock);
    console.log(`📜 Found ${events.length} historical سevents`);
    for (const ev of events) {
      await processEvent(ev.args[0], ev.args[1], ev.args[2], ev, false);
    }
  } catch (err) {
    console.error("❌ History fetch error:", err.message);
  }
}

// ===== Live =====
function listenLive() {
  contract.on("Transfer", async (from, to, tokenId, event) => {
    await processEvent(from, to, tokenId, event, true);
  });
}

// ===== پردازش رویداد =====
async function processEvent(from, to, tokenId, event, isLive) {
  let domainName = "";
  try {
    domainName = await contract.getDomainByTokenId(tokenId);
  } catch (err) {
    console.warn(`⚠️ Domain fetch failed for token ${tokenId}: ${err.message}`);
  }

  const isMint = from.toLowerCase() === ZERO_ADDRESS.toLowerCase();
  const { blockNum, timestamp } = await getBlockDetailsFromEvent(event);

  console.log(`\n[${isLive ? "LIVE" : "HISTORY"}] Block #${blockNum ?? "?"}`);
  console.log(`  From: ${from}`);
  console.log(`  To:   ${to}`);
  console.log(`  Token: ${tokenId.toString()}`);
  console.log(`  Domain: ${domainName}`);
  console.log(`  Mint event: ${isMint}`);
  if (timestamp) console.log(`  Time: ${new Date(timestamp * 1000).toISOString()}`);

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

// ===== شروع =====
await sendHistory();
listenLive();
console.log("🚀 Listener running (history + live mode)");
