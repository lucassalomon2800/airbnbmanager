const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function calcNights(checkIn, checkOut) {
  return Math.max(0, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000));
}

// ── Bookings ──────────────────────────────────────────────────────────────────
app.get('/api/bookings', (req, res) => {
  res.json(readDB().bookings);
});

app.post('/api/bookings', (req, res) => {
  const db = readDB();
  const booking = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
  db.bookings.push(booking);
  writeDB(db);
  res.json(booking);
});

app.put('/api/bookings/:id', (req, res) => {
  const db = readDB();
  const idx = db.bookings.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.bookings[idx] = { ...db.bookings[idx], ...req.body };
  writeDB(db);
  res.json(db.bookings[idx]);
});

app.delete('/api/bookings/:id', (req, res) => {
  const db = readDB();
  db.bookings = db.bookings.filter(b => b.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// ── Expenses / Investments ────────────────────────────────────────────────────
app.get('/api/investments', (req, res) => {
  res.json(readDB().investments);
});

app.post('/api/investments', (req, res) => {
  const db = readDB();
  const item = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
  db.investments.push(item);
  writeDB(db);
  res.json(item);
});

app.delete('/api/investments/:id', (req, res) => {
  const db = readDB();
  db.investments = db.investments.filter(i => i.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// ── Inventory ─────────────────────────────────────────────────────────────────
app.get('/api/inventory', (req, res) => {
  res.json(readDB().inventory);
});

app.post('/api/inventory', (req, res) => {
  const db = readDB();
  const item = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
  db.inventory.push(item);
  writeDB(db);
  res.json(item);
});

app.put('/api/inventory/:id', (req, res) => {
  const db = readDB();
  const idx = db.inventory.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.inventory[idx] = { ...db.inventory[idx], ...req.body };
  writeDB(db);
  res.json(db.inventory[idx]);
});

app.delete('/api/inventory/:id', (req, res) => {
  const db = readDB();
  db.inventory = db.inventory.filter(i => i.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// ── Summary ───────────────────────────────────────────────────────────────────
app.get('/api/summary', (req, res) => {
  const { bookings, investments } = readDB();

  const activeBookings = bookings.filter(b => b.status !== 'cancelled');

  const totalRevenue = activeBookings.reduce((sum, b) => {
    return sum + calcNights(b.checkIn, b.checkOut) * b.nightlyRate;
  }, 0);

  const totalExpenses = investments.reduce((sum, i) => sum + i.amount, 0);

  const totalNights = activeBookings.reduce((sum, b) => {
    return sum + calcNights(b.checkIn, b.checkOut);
  }, 0);

  const avgNightlyRate =
    activeBookings.length > 0
      ? activeBookings.reduce((sum, b) => sum + b.nightlyRate, 0) / activeBookings.length
      : 0;

  // Monthly revenue breakdown (last 6 months)
  const monthly = {};
  activeBookings.forEach(b => {
    const month = b.checkIn.slice(0, 7);
    const revenue = calcNights(b.checkIn, b.checkOut) * b.nightlyRate;
    monthly[month] = (monthly[month] || 0) + revenue;
  });

  res.json({
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    totalBookings: bookings.length,
    activeBookings: activeBookings.length,
    totalNights,
    avgNightlyRate,
    monthly,
  });
});

app.listen(PORT, () => {
  console.log(`Backend running → http://localhost:${PORT}`);
});
