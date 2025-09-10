const fs = require("fs");
const circomlibjs = require("circomlibjs");
const ffutils = require("ffjavascript").utils;

async function main() {
    const priv_whois_strings = [
        "EXAMPLE.COM",
        "Internet Assigned Numbers Authority",
        "1992-01-01",
        "IANA"
    ];

    // تبدیل هر رشته به BigInt
    const priv_whois_bigints = priv_whois_strings.map(stringToBigInt);

    const poseidon = await circomlibjs.buildPoseidon();
    const pubHash = poseidon.F.toObject(
        poseidon(priv_whois_bigints)
    ).toString();

    const input = {
        priv_whois: priv_whois_bigints.map(n => n.toString()),
        pubHash
    };

    fs.writeFileSync("input.json", JSON.stringify(input, null, 2));
    console.log("✅ input.json ساخته شد");
    console.log("pubHash:", pubHash);
}

function stringToBigInt(str) {
    return ffutils.leBuff2int(Buffer.from(str, "utf8"));
}

main();

