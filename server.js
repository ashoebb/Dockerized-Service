require('dotenv').config({ override: true });

const express = require('express');
const auth = require('basic-auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Basic Auth middleware
const basicAuth = (req, res, next) => {
  const user = auth(req);
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;

  if (!user || user.name !== username || user.pass !== password) {
    res.set('WWW-Authenticate', 'Basic realm="Secret Area"');
    return res.status(401).send('Authentication required');
  }
  next();
};

// Route: GET / - Returns Hello, world!
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// Route: GET /secret - Protected by Basic Auth
app.get('/secret', basicAuth, (req, res) => {
  const secretMessage = process.env.SECRET_MESSAGE || 'No secret message configured';
  res.send(secretMessage);
});

// Health check endpoint for Docker/load balancer
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});