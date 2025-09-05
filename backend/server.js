import express from 'express';
import cors from 'cors';
import whois from 'whois-json';

const app = express();
app.use(cors());

app.get('/whois/:domain', async (req, res) => {
  const domain = req.params.domain;
  try {
    const result = await whois(domain);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`WHOIS API running on port ${PORT}`));
