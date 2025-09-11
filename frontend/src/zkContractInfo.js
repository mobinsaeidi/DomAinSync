export const ZK_CONTRACT_ADDRESS = "0xf95e1621357425eeFCaFB0D97Bb38F107c85D52B";
export const ZK_CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_verifier", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "string", "name": "domain", "type": "string" },
      { "indexed": false, "internalType": "bytes32", "name": "pubHash", "type": "bytes32" },
      { "indexed": false, "internalType": "uint256[2]", "name": "a", "type": "uint256[2]" },
      { "indexed": false, "internalType": "uint256[2][2]", "name": "b", "type": "uint256[2][2]" },
      { "indexed": false, "internalType": "uint256[2]", "name": "c", "type": "uint256[2]" }
    ],
    "name": "WhoisProofSubmitted",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "domain", "type": "string" },
      { "internalType": "bytes32", "name": "pubHash", "type": "bytes32" },
      { "internalType": "uint256[2]", "name": "a", "type": "uint256[2]" },
      { "internalType": "uint256[2][2]", "name": "b", "type": "uint256[2][2]" },
      { "internalType": "uint256[2]", "name": "c", "type": "uint256[2]" },
      { "internalType": "uint256[1]", "name": "input", "type": "uint256[1]" }
    ],
    "name": "submitProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "verifier",
    "outputs": [
      { "internalType": "contract IGroth16Verifier", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];