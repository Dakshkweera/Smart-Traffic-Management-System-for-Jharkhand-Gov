const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const trafficRoutes = require('./routes/trafficRoutes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/traffic', trafficRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'OK', service: 'Traffic Intelligence Backend' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
