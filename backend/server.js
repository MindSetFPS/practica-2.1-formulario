const express = require('express');
const cors = require('cors');
const { initSchema } = require('./db');
const { register, login } = require('./auth');

const app = express();
const PORT = 3421;

app.use(cors());
app.use(express.json());

initSchema();

app.post('/api/register', async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  const result = await register(email, password, confirmPassword);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(201).json(result);
});

app.post('/api/login', async (req, res) => {
  const { email, password, humanToken, captchaAnswer } = req.body;

  const result = await login(email, password, humanToken, captchaAnswer);

  if (!result.success) {
    return res.status(401).json(result);
  }

  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
