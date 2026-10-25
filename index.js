const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/api/landdata', async (req, res) => {
    const { vsrno, gisCode, plotNo, state } = req.query;
    const targetUrl = `https://ap.gov.in{vsrno || '1306007'}&gisCode=${gisCode || 'B1306007_'}&plotNo=${plotNo || '4519'}&state=${state || '28'}`;

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://ap.gov.in',
                'Referer': 'https://ap.gov.in/'
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running`));
