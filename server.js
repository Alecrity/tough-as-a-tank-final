const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database table
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS participants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        company VARCHAR(255),
        score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database table initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
}

initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes

// Register a new participant
app.post('/api/register', async (req, res) => {
  const { name, email, phone, company } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO participants (name, email, phone, company) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone || null, company || null]
    );
    
    res.json({ 
      success: true, 
      participant: result.rows[0]
    });
  } catch (err) {
    console.error('Error registering participant:', err);
    res.status(500).json({ error: 'Failed to register participant' });
  }
});

// Get all participants (for staff interface)
app.get('/api/participants', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM participants ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching participants:', err);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// Get participant count
app.get('/api/count', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM participants');
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Error fetching count:', err);
    res.status(500).json({ error: 'Failed to fetch count' });
  }
});

// Update participant score
app.post('/api/score', async (req, res) => {
  const { id, score } = req.body;
  
  if (!id || score === undefined) {
    return res.status(400).json({ error: 'ID and score are required' });
  }

  try {
    const result = await pool.query(
      'UPDATE participants SET score = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [score, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    res.json({ 
      success: true, 
      participant: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating score:', err);
    res.status(500).json({ error: 'Failed to update score' });
  }
});

// Get leaderboard (participants with scores, sorted)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, company, score FROM participants WHERE score IS NOT NULL ORDER BY score DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Export all data as CSV
app.get('/api/export-csv', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM participants ORDER BY created_at DESC'
    );
    
    // Create CSV header
    let csv = 'ID,Name,Email,Phone,Company,Score,Created At,Updated At\n';
    
    // Add rows
    result.rows.forEach(participant => {
      csv += `${participant.id},"${participant.name}","${participant.email}","${participant.phone || ''}","${participant.company || ''}",${participant.score || ''},${participant.created_at},${participant.updated_at}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tough-as-a-tank-participants.csv');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting CSV:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Delete a participant
app.delete('/api/participants/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'DELETE FROM participants WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Participant deleted',
      participant: result.rows[0]
    });
  } catch (err) {
    console.error('Error deleting participant:', err);
    res.status(500).json({ error: 'Failed to delete participant' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM participants');
    const total = parseInt(result.rows[0].count);
    const scoredResult = await pool.query('SELECT COUNT(*) FROM participants WHERE score IS NOT NULL');
    const scored = parseInt(scoredResult.rows[0].count);
    
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'postgresql',
      participantCount: total,
      scoredParticipants: scored
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: err.message 
    });
  }
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
  console.log(`🚀 Tough as a Tank Challenge API running on port ${PORT}`);
  console.log(`📊 Database: PostgreSQL`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
