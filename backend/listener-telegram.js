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
const CONTRACT_ADDRESS = "0xFcE33744f429aB77Eb84f0cC0829876167C343c2";

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

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

        const etherscanTx = `https://sepolia.etherscan.io/tx/${txHash}`;
        const etherscanBlock = blockNumber !== "N/A" 
            ? `https://sepolia.etherscan.io/block/${blockNumber}` 
            : null;

        const message =
`Domain Transfer Alert

From: \`${from}\`
To: \`${to}\`
Token ID: \`${tokenId}\`
Domain: \`${domainName || 'N/A'}\`
Price: \`${priceEth} ETH\`
Block: ${etherscanBlock ? `[${blockNumber}](${etherscanBlock})` : `\`${blockNumber}\``}
Tx: [View on Etherscan](${etherscanTx})`;

        await bot.sendMessage(CHAT_ID, message, { parse_mode: "Markdown" });
        console.log("Telegram message sent:", { from, to, tokenId, domainName, priceEth, blockNumber });

    } catch (err) {
        console.error("Error handling Transfer event:", err);
    }
});
