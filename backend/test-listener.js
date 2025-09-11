import { sendTelegramMessage } from "./services/telegramService.js";

(async () => {
  console.log("Starting Telegram message test...");
  await sendTelegramMessage("Hello from test-listener.js 🚀");
  console.log("Test completed.");
})();
