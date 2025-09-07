import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;


async function checkTelegramStatus() {
  try {
    console.log('Checking bot info...');
    const me = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    console.log('Bot Info:', me.data);

    console.log('🔍 Getting latest updates...');
    const updates = await axios.get(`https://api.telegram.org/bot${token}/getUpdates`);
    console.log('Updates:', JSON.stringify(updates.data, null, 2));
  } catch (err) {
    console.error('Telegram API check error:', err.response?.data || err.message);
  }
}


export async function sendTelegramMessage(text) {
  try {
    const resp = await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: chatId,
        text
      }
    );
    console.log('Telegram message sent:', resp.data);
  } catch (err) {
    console.error('Telegram API error:', err.response?.data || err.message);
  }
}

(async () => {
  await checkTelegramStatus();
  console.log(`\n Sending test message to chat_id=${chatId} ...`);
  await sendTelegramMessage('connected');
})();
