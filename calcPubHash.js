const circomlibjs = require("circomlibjs");

async function main() {
  const poseidon = await circomlibjs.buildPoseidon();

  const priv_whois = [
    "9838265414133982024307533",
    "98845264325007698131137299810584926713784923873711664542926966629965168715737",
    "25245154347911964063537",
    "1229126641",
    "0"
  ].map(BigInt);

  const hash = poseidon(priv_whois);
  const hashStr = poseidon.F.toString(hash);
  
  console.log(hashStr);
  console.log(
    hashStr === "1039295561658224528318955332846311917121698364827465731593047821592669"
      ? "yes"
      : "no"
  );
}

main();
