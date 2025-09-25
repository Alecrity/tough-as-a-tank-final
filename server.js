const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// JSON Database file
const DB_FILE = './participants.json';

// Initialize database file if it doesn't exist
function initializeDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ participants: [], nextId: 1 }));
  }
}

// Read database
function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { participants: [], nextId: 1 };
  }
}

// Write database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

// Initialize database on startup
initializeDB();

// API Routes

// Register new participant
app.post('/api/register', (req, res) => {
  const { name, email, phone, company } = req.body;
  
  if (!name || !email || !phone || !company) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const db = readDB();
  
  // Check if email already exists
  const existingParticipant = db.participants.find(p => p.email.toLowerCase() === email.toLowerCase());
  if (existingParticipant) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  // Create new participant
  const newParticipant = {
    id: db.nextId,
    name,
    email,
    phone,
    company,
    score: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.participants.push(newParticipant);
  db.nextId++;

  if (writeDB(db)) {
    res.status(201).json({ 
      message: 'Registration successful',
      participant: {
        id: newParticipant.id,
        name,
        email,
        phone,
        company
      }
    });
  } else {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get participant count
app.get('/api/participant-count', (req, res) => {
  const db = readDB();
  res.json({ count: db.participants.length });
});

// Get all participants (for staff interface)
app.get('/api/participants', (req, res) => {
  const db = readDB();
  const participants = db.participants
    .map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      company: p.company,
      score: p.score,
      updated_at: p.updated_at
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  res.json(participants);
});

// Update participant score
app.post('/api/scores/:id', (req, res) => {
  const participantId = parseInt(req.params.id);
  const { score } = req.body;
  
  if (!score || score < 0) {
    return res.status(400).json({ error: 'Valid score is required' });
  }

  const db = readDB();
  const participant = db.participants.find(p => p.id === participantId);
  
  if (!participant) {
    return res.status(404).json({ error: 'Participant not found' });
  }

  const newScore = parseFloat(score);
  const currentScore = participant.score;
  
  // Only update if new score is higher or if no previous score
  if (currentScore === null || newScore > currentScore) {
    participant.score = newScore;
    participant.updated_at = new Date().toISOString();
    
    if (writeDB(db)) {
      res.json({ 
        message: 'Score updated successfully',
        newRecord: true,
        score: newScore
      });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  } else {
    res.json({ 
      message: 'Previous score was higher',
      newRecord: false,
      currentScore: currentScore,
      attemptedScore: newScore
    });
  }
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  const db = readDB();
  const leaderboard = db.participants
    .filter(p => p.score !== null)
    .map(p => ({
      id: p.id,
      name: p.name,
      company: p.company,
      score: p.score
    }))
    .sort((a, b) => b.score - a.score);
  
  res.json(leaderboard);
});

// Export all data (for post-event analysis)
app.get('/api/export', (req, res) => {
  const db = readDB();
  
  // Set headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="tough-as-tank-results.csv"');
  
  // Create CSV content
  let csv = 'ID,Name,Email,Phone,Company,Score,Registered At,Last Updated\n';
  
  // Sort by score (highest first), then by name
  const sortedParticipants = db.participants
    .sort((a, b) => {
      if (b.score !== null && a.score !== null) {
        return b.score - a.score;
      }
      if (b.score !== null) return 1;
      if (a.score !== null) return -1;
      return a.name.localeCompare(b.name);
    });
  
  sortedParticipants.forEach(participant => {
    csv += `${participant.id},"${participant.name}","${participant.email}","${participant.phone}","${participant.company}",${participant.score || ''},${participant.created_at},${participant.updated_at}\n`;
  });
  
  res.send(csv);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const db = readDB();
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'json-file',
    participantCount: db.participants.length,
    scoredParticipants: db.participants.filter(p => p.score !== null).length
  });
});

// Specific routes for pages
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  const db = readDB();
  console.log(`🚀 Tough as a Tank Challenge API running on port ${PORT}`);
  console.log(`📊 Database: JSON file (./participants.json)`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`👥 Current participants: ${db.participants.length}`);
  console.log(`🏆 Participants with scores: ${db.participants.filter(p => p.score !== null).length}`);
});
