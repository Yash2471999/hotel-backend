const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Test DB Connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database!');
    connection.release();
  }
});

// Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'Hotel Backend is running!' });
});

// Get all rooms
app.get('/api/rooms', (req, res) => {
  db.query('SELECT * FROM rooms', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get all guests
app.get('/api/guests', (req, res) => {
  db.query('SELECT * FROM guests ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Check in a guest
app.post('/api/guests/checkin', (req, res) => {
  const { name, room_number, check_in, check_out, amount } = req.body;
  if (!name || !room_number || !check_in || !check_out || !amount) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const query = 'INSERT INTO guests (name, room_number, check_in, check_out, status, amount) VALUES (?, ?, ?, ?, "checked-in", ?)';
  db.query(query, [name, room_number, check_in, check_out, amount], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    // Update room status
    db.query('UPDATE rooms SET status = "occupied" WHERE room_number = ?', [room_number]);
    res.json({ message: 'Guest checked in successfully!', id: result.insertId });
  });
});

// Check out a guest
app.put('/api/guests/checkout/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT room_number FROM guests WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Guest not found' });
    const roomNumber = results[0].room_number;
    db.query('UPDATE guests SET status = "checked-out" WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      db.query('UPDATE rooms SET status = "available" WHERE room_number = ?', [roomNumber]);
      res.json({ message: 'Guest checked out successfully!' });
    });
  });
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  const stats = {};
  db.query('SELECT COUNT(*) as total FROM rooms', (err, result) => {
    stats.totalRooms = result[0].total;
    db.query('SELECT COUNT(*) as available FROM rooms WHERE status = "available"', (err, result) => {
      stats.availableRooms = result[0].available;
      db.query('SELECT COUNT(*) as occupied FROM rooms WHERE status = "occupied"', (err, result) => {
        stats.occupiedRooms = result[0].occupied;
        db.query('SELECT COUNT(*) as active FROM guests WHERE status = "checked-in"', (err, result) => {
          stats.activeGuests = result[0].active;
          db.query('SELECT SUM(amount) as revenue FROM guests WHERE status = "checked-in"', (err, result) => {
            stats.totalRevenue = result[0].revenue || 0;
            res.json(stats);
          });
        });
      });
    });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Hotel Backend running on port ${PORT}`);
});
```

---

### File 3 — `.env`
```
DB_HOST=<kubernetes-ec2-public-ip>
DB_USER=hoteluser
DB_PASSWORD=Hotel@123
DB_NAME=hoteldb
PORT=5000
