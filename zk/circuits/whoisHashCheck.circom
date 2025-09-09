pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template WhoisHashCheck(n) {
    // --- Inputs ---
    signal input priv_whois[n]; // private WHOIS fields
    signal input pubHash;       // public hash stored on-chain

    // --- Poseidon hash ---
    component hasher = Poseidon(n);

    for (var i = 0; i < n; i++) {
        hasher.inputs[i] <== priv_whois[i];
    }

    // --- Equality constraint ---
    hasher.out === pubHash;
}

component main {public [pubHash]} = WhoisHashCheck(5);