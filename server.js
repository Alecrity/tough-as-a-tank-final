const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Server working!',
    timestamp: new Date().toISOString()
  });
});

// Specific routes for your pages
app.get('/leaderboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/leaderboard.html'));
});

app.get('/staff', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/staff.html'));
});

app.get('/popup.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/popup.js'));
});

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
