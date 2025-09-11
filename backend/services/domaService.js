
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const baseURL = process.env.DOMA_API_BASE; 
const apiKey = process.env.DOMA_API_KEY;


export async function autoListDomain(contractAddress, tokenId, offerer, domainName) {
  try {
    
    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + 60 * 60 * 24 * 7; 

    
    const payload = {
      orderbook: "DOMA", 
      chainId: "eip155:11155111", 
      parameters: {
        offerer: offerer, 
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
              itemType: 2, 
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
              itemType: 0, 
              token: "0x0000000000000000000000000000000000000000",
              identifier: "0",
              startAmount: "20000000000000000", 
              endAmount: "20000000000000000",
              recipient: offerer, 
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
        "deadbeef".padStart(130, "f"), 
    };

    const headers = {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    };

    const { data } = await axios.post(`${baseURL}/v1/orderbook/list`, payload, {
      headers,
    });

    console.log(` Domain listed on Doma: ${domainName} (tokenId: ${tokenId})`);
    return data;
  } catch (err) {
    console.error(
      ` Failed to auto-list domain ${domainName}:`,
      err.response?.data || err.message
    );
  }
}
