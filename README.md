DomAinSync connects Web2 domain registration data (WHOIS) with Web3 NFTs on the Doma Testnet.

Any change in ownership from either side is detected and synchronized in real time through event-driven bots.

Main Capabilities

Representation of Web2 domains as ERC-721 NFTs
Automatic two-way synchronization between WHOIS and blockchain data
Event-driven architecture with Web2 and Web3 listeners
Web dashboard for monitoring and actions
Technology Stack

Solidity, Hardhat, Doma Testnet
Node.js, ethers.js / viem
Next.js, Tailwind CSS
WHOIS API integration
Setup Instructions

Contracts:
cd contracts
npm install
npx hardhat compile

Backend:
cd …/backend
npm install
node web2Fetcher.js

Frontend:
cd …/frontend
npm install
npm run dev

License:
MIT
