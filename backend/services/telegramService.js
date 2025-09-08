import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.join(__dirname, "../../.env") });

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
  console.error("TELEGRAM_BOT_TOKEN");
  process.exit(1);
}

export async function sendTelegramMessage(text) {
  try {
    const resp = await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      { chat_id: chatId, text }
    );
    console.log("Telegram message sent:", resp.data);
  } catch (err) {
    console.error("Telegram API error:", err.response?.data || err.message);
  }
}


if (process.argv[1] === __filename) {
  (async () => {
    console.log(`Sending test message to chat_id=${chatId} ...`);
    await sendTelegramMessage("Connected to Telegram Bot successfully ");
  })();
}
