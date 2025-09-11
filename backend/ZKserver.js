import express from 'express';
import cors from 'cors';
import whois from 'whois-json';
import * as circomlibjs from 'circomlibjs';

const app = express();
app.use(cors());

// تابع کمکی برای تبدیل WHOIS به عدد
function whoisToArray(whoisData) {
  const registryDomainIdNum = BigInt(parseInt(whoisData.registryDomainId?.replace(/\D/g, '') || '0'));
  const registrarNum = BigInt(parseInt(whoisData.registrarIANAId || '0'));
  const creationDateNum = BigInt(Math.floor(new Date(whoisData.creationDate || 0).getTime() / 1000));
  const expiryDateNum = BigInt(Math.floor(new Date(whoisData.registrarRegistrationExpirationDate || 0).getTime() / 1000));
  const reservedNum = BigInt(0);
  return [registryDomainIdNum, registrarNum, creationDateNum, expiryDateNum, reservedNum];
}

// مسیر WHOIS خام
app.get('/whois/:domain', async (req, res) => {
  try {
    const result = await whois(req.params.domain);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// مسیر محاسبه pubHash
app.get('/pubhash/:domain', async (req, res) => {
  try {
    const whoisData = await whois(req.params.domain);
    const priv_whois = whoisToArray(whoisData);

    const poseidon = await circomlibjs.buildPoseidon();
    const hash = poseidon(priv_whois);
    const pubHash = poseidon.F.toString(hash);

    res.json({
      success: true,
      domain: req.params.domain,
      priv_whois: priv_whois.map(String),
      pubHash
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`WHOIS API running on port ${PORT}`));
