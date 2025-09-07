// backend/services/domaService.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const baseURL = process.env.DOMA_API_BASE; // مثلا https://api-testnet.doma.xyz
const apiKey = process.env.DOMA_API_KEY;

// این تابع فعلا از داده و امضای تستی استفاده می‌کنه
export async function autoListDomain(contractAddress, tokenId, offerer, domainName) {
  try {
    // زمان شروع و پایان (epoch seconds)
    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + 60 * 60 * 24 * 7; // یک هفته بعد

    // payload مطابق مستندات DOMA Testnet API
    const payload = {
      orderbook: "DOMA", // می‌تونه OPENSEA هم باشه
      chainId: "eip155:11155111", // فرض: chainId سپولیا روی تست‌نت DOMA
      parameters: {
        offerer: offerer, // آدرس صاحب دامنه
        zone: "0x0000000000000000000000000000000000000000",
        orderType: 0,
        startTime: `${startTime}`,
        endTime: `${endTime}`,
        zoneHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        salt: "0x" + Math.floor(Math.random() * 1e16).toString(16).padStart(64, "0"),
        offer: [
          [
            {
              itemType: 2, // ERC721
              token: contractAddress,
              identifier: `${tokenId}`,
              startAmount: "1",
              endAmount: "1",
            },
          ],
        ],
        consideration: [
          [
            {
              itemType: 0, // ETH
              token: "0x0000000000000000000000000000000000000000",
              identifier: "0",
              startAmount: "20000000000000000", // 0.02 ETH
              endAmount: "20000000000000000",
              recipient: offerer, // فروشنده پول رو می‌گیره
            },
          ],
        ],
        totalOriginalConsiderationItems: 1,
        conduitKey:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        counter: "0",
      },
      signature:
        "0x" +
        "deadbeef".padStart(130, "f"), // امضای تستی — باید با EIP-712 ساخته بشه برای واقعی
    };

    const headers = {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    };

    const { data } = await axios.post(`${baseURL}/v1/orderbook/list`, payload, {
      headers,
    });

    console.log(`✅ Domain listed on Doma: ${domainName} (tokenId: ${tokenId})`);
    return data;
  } catch (err) {
    console.error(
      `❌ Failed to auto-list domain ${domainName}:`,
      err.response?.data || err.message
    );
  }
}
