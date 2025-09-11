import { ethers } from "ethers";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import TelegramBot from "node-telegram-bot-api";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const abiFilePath = path.join(__dirname, "DomainDualIdentityABI.json");
const CONTRACT_ABI = JSON.parse(fs.readFileSync(abiFilePath, "utf8"));
const CONTRACT_ADDRESS = "0x96db117d850F1ca2990374Da4E027B9aE6716D81"; // Doma Testnet

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
const DOMA_EXPLORER_BASE = "https://explorer-testnet.doma.xyz";

console.log("Listening for Transfer events & sending to Telegram...");

contract.on("Transfer", async (from, to, tokenId, event) => {
    try {
        const domainName = await contract.getDomainByTokenId(tokenId.toString());

        const txHash = event.log?.transactionHash || event.transactionHash;
        let blockNumber, priceEth = "0";

        if (txHash) {
            const receipt = await provider.getTransactionReceipt(txHash);
            blockNumber = receipt?.blockNumber ?? "N/A";

            const tx = await provider.getTransaction(txHash);
            if (tx?.value) {
                priceEth = ethers.formatEther(tx.value);
            }
        } else {
            blockNumber = event.log?.blockNumber ?? "N/A";
        }

        const explorerTx = `${DOMA_EXPLORER_BASE}/tx/${txHash}`;
        const explorerBlock = blockNumber !== "N/A"
            ? `${DOMA_EXPLORER_BASE}/block/${blockNumber}`
            : null;

        const message = 
`*DOMAIN TRANSFER ALERT*
────────────────────────
*From:* [${from}](${DOMA_EXPLORER_BASE}/address/${from})
*To:* [${to}](${DOMA_EXPLORER_BASE}/address/${to})
*Token ID:* \`${tokenId}\`
*Domain:* \`${domainName || 'N/A'}\`
*Price:* \`${priceEth} ETH\`
*Block:* ${explorerBlock ? `[${blockNumber}](${explorerBlock})` : `\`${blockNumber}\``}
*Tx:* [View Transaction](${explorerTx})`;

        await bot.sendMessage(CHAT_ID, message, { parse_mode: "Markdown" });
        console.log("Telegram message sent:", { from, to, tokenId, domainName, priceEth, blockNumber });

    } catch (err) {
        console.error("Error handling Transfer event:", err);
    }
});
