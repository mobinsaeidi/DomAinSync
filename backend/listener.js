import { ethers } from "ethers";
import dotenv from "dotenv";
import abi from "./DomainDualIdentityABI.json" with { type: "json" };
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.join(__dirname, "../.env") });

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);

contract.on("Transfer", (from, to, tokenId, event) => {
  console.log("------ New Event Detected ------");
  console.log("From:", from);
  console.log("To:", to);
  console.log("Token ID:", tokenId.toString());
  console.log("Block:", event.blockNumber);
});
