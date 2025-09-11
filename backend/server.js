import express from 'express';
import cors from 'cors';
import whois from 'whois-json';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import * as circomlibjs from 'circomlibjs';

const baseZkDir = path.join(process.cwd(), '..', 'zk_instances');
fs.mkdirSync(baseZkDir, { recursive: true });

let instanceCounter = 0;
const POSEIDON_INPUT_COUNT = 4;

const app = express();
app.use(cors());


async function computePubHash(privWhois) {
  const poseidon = await circomlibjs.buildPoseidon();
  const hash = poseidon(privWhois.map(BigInt));
  return poseidon.F.toString(hash);
}


app.get('/whois/:domain', async (req, res) => {
  try {
    const data = await whois(req.params.domain);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.get('/gen-proof/:domain', async (req, res) => {
  const domain = req.params.domain;
  instanceCounter++;
  const instanceDir = path.join(baseZkDir, `zk${instanceCounter}`);
  fs.mkdirSync(instanceDir, { recursive: true });

  const inputPath = path.join(instanceDir, 'input.json');
  const witnessPath = path.join(instanceDir, 'witness.wtns');
  const proofPath = path.join(instanceDir, 'proof.json');
  const publicPath = path.join(instanceDir, 'public.json');

  try {
    
    const whoisData = await whois(domain);
    const priv_whois = Object.values(whoisData)
      .slice(0, POSEIDON_INPUT_COUNT)
      .map(v => BigInt(String(v).length));

    const pubHash = await computePubHash(priv_whois);
    fs.writeFileSync(inputPath, JSON.stringify({
      priv_whois: priv_whois.map(String),
      pubHash
    }));

    const zkBuildDir = path.join(process.cwd(), '..', 'zk', 'build');
    const wasmFile = path.join(zkBuildDir, 'whoisHashCheck_js', 'whoisHashCheck.wasm');
    const witnessGen = path.join(zkBuildDir, 'whoisHashCheck_js', 'generate_witness.js');
    const zkeyFile = path.join(zkBuildDir, 'whoisHashCheck_final.zkey');

    
    execFileSync('node', [witnessGen, wasmFile, inputPath, witnessPath], { stdio: 'inherit' });

    
    execFileSync('npx', [
      'snarkjs', 'groth16', 'prove',
      zkeyFile,
      witnessPath,
      proofPath,
      publicPath
    ], { stdio: 'inherit' });

    
    const proof = JSON.parse(fs.readFileSync(proofPath));
    const publicInputs = JSON.parse(fs.readFileSync(publicPath));

    res.json({
      success: true,
      pubHash,
      proof,
      publicInputs: publicInputs.map(String)
    });

  } catch (err) {
    console.error('Proof generation error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    
    fs.rmSync(instanceDir, { recursive: true, force: true });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`WHOIS+ZK API running on port ${PORT}`));
