// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGroth16Verifier {
    function verifyProof(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[1] calldata input
    ) external view returns (bool);
}

contract WhoisZKBridge {
    IGroth16Verifier public verifier;

    event WhoisProofSubmitted(
        string domain,
        bytes32 pubHash,
        uint[2] a,
        uint[2][2] b,
        uint[2] c
    );

    constructor(address _verifier) {
        verifier = IGroth16Verifier(_verifier);
    }

    function submitProof(
        string calldata domain,
        bytes32 pubHash,
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[1] calldata input
    ) external {
        require(
            verifier.verifyProof(a, b, c, input),
            "Invalid proof"
        );

        emit WhoisProofSubmitted(domain, pubHash, a, b, c);
    }
}
