// backend/listener.js - debug mode + domain names + auto-listing
import { ethers } from "ethers";
import dotenv from "dotenv";
import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { autoListDomain } from "./services/domaService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// env vars
dotenv.config({ path: path.join(__dirname, "../.env") });
const RPC_URL = process.env.RPC_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const DEPLOY_BLOCK = parseInt(process.env.DEPLOY_BLOCK, 10, 10);

const abiPath = path.join(__dirname, "DomainDualIdentityABI.json");
const abi = JSON.parse(readFileSync(abiPath, "utf8"));

const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

let lastCheckedBlock = DEPLOY_BLOCK;

// 📌 مرحله ۱: بررسی همهٔ لاگ‌ها برای دیباگ
async function debugAllLogs() {
  console.log(`🔍 Fetching ALL logs from block ${DEPLOY_BLOCK} in chunks...`);
  const latestBlock = await provider.getBlockNumber();
  const chunkSize = 2000;
  let fromBlock = DEPLOY_BLOCK;
  let logCount = 0;

  while (fromBlock <= latestBlock) {
    const toBlock = Math.min(fromBlock + chunkSize - 1, latestBlock);
    const logs = await provider.getLogs({ fromBlock, toBlock });

    logs.forEach((log, idx) => {
      console.log(
        `[${fromBlock}-${toBlock}] #${idx + 1}: address=${log.address}, topics=${log.topics}`
      );
      logCount++;
    });

    fromBlock = toBlock + 1;
  }
  console.log(`✅ Finished. Total logs found: ${logCount}`);
}

// 📌 گرفتن اسم دامنه از tokenId
async function getDomainName(tokenId) {
  try {
    return await contract.getDomainByTokenId(tokenId);
  } catch {
    return "(domain not found)";
  }
}

// 📌 پردازش رویداد + Auto-Listing
async function processTransfer(event, label = "Transfer") {
  const [from, to, tokenIdBN] = event.args;
  const tokenId = tokenIdBN.toString();
  const domainName = await getDomainName(tokenId);

  console.log(
    `${label} → ${domainName} | from: ${from} to: ${to} tokenId: ${tokenId} (Block ${event.blockNumber})`
  );

  // Auto-list دامنه اگر پیدا شد
  if (domainName !== "(domain not found)") {
    await autoListDomain(CONTRACT_ADDRESS, tokenId, to, domainName);
  }
}

// 📌 مرحله ۲: واکشی رویدادهای گذشته
async function fetchPastEvents() {
  console.log(`📜 Fetching past Transfer events from block ${DEPLOY_BLOCK}...`);
  try {
    const latestBlock = await provider.getBlockNumber();
    const events = await contract.queryFilter("Transfer", DEPLOY_BLOCK, latestBlock);

    if (events.length === 0) {
      console.warn("⚠ No Transfer events found in this range.");
    } else {
      for (let i = 0; i < events.length; i++) {
        await processTransfer(events[i], `#${i + 1} Past Transfer`);
      }
    }
    lastCheckedBlock = latestBlock + 1;
    console.log(`✅ Past events fetched. Now listening for new events...`);
  } catch (err) {
    console.error("❌ Error fetching past events:", err);
  }
}

// 📌 مرحله ۳: پایش رویدادهای جدید
async function pollEvents() {
  try {
    const latestBlock = await provider.getBlockNumber();
    if (latestBlock >= lastCheckedBlock) {
      const events = await contract.queryFilter("Transfer", lastCheckedBlock, latestBlock);
      for (const event of events) {
        await processTransfer(event, "📦 New Transfer");
      }
      lastCheckedBlock = latestBlock + 1;
    }
  } catch (err) {
    console.error("❌ Error polling events:", err);
  }
}

// اجرای مراحل
await debugAllLogs();
await fetchPastEvents();
setInterval(pollEvents, 1500);
