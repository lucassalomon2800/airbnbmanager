require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { readSheet, writeSheet } = require('./sheets');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function calcNights(checkIn, checkOut) {
  return Math.max(0, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000));
}

// ── Bookings ──────────────────────────────────────────────────────────────────
app.get('/api/bookings', async (req, res) => {
  res.json(await readSheet('Bookings'));
});

app.post('/api/bookings', async (req, res) => {
  const bookings = await readSheet('Bookings');
  const booking = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
  bookings.push(booking);
  await writeSheet('Bookings', bookings);
  res.json(booking);
});

app.put('/api/bookings/:id', async (req, res) => {
  const bookings = await readSheet('Bookings');
  const idx = bookings.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  bookings[idx] = { ...bookings[idx], ...req.body };
  await writeSheet('Bookings', bookings);
  res.json(bookings[idx]);
});

app.delete('/api/bookings/:id', async (req, res) => {
  const bookings = (await readSheet('Bookings')).filter(b => b.id !== req.params.id);
  await writeSheet('Bookings', bookings);
  res.json({ success: true });
});

// ── Expenses / Investments ────────────────────────────────────────────────────
app.get('/api/investments', async (req, res) => {
  res.json(await readSheet('Investments'));
});

app.post('/api/investments', async (req, res) => {
  const investments = await readSheet('Investments');
  const item = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
  investments.push(item);
  await writeSheet('Investments', investments);
  res.json(item);
});

app.delete('/api/investments/:id', async (req, res) => {
  const investments = (await readSheet('Investments')).filter(i => i.id !== req.params.id);
  await writeSheet('Investments', investments);
  res.json({ success: true });
});

// ── Inventory ─────────────────────────────────────────────────────────────────
app.get('/api/inventory', async (req, res) => {
  res.json(await readSheet('Inventory'));
});

app.post('/api/inventory', async (req, res) => {
  const inventory = await readSheet('Inventory');
  const item = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
  inventory.push(item);
  await writeSheet('Inventory', inventory);
  res.json(item);
});

app.put('/api/inventory/:id', async (req, res) => {
  const inventory = await readSheet('Inventory');
  const idx = inventory.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  inventory[idx] = { ...inventory[idx], ...req.body };
  await writeSheet('Inventory', inventory);
  res.json(inventory[idx]);
});

app.delete('/api/inventory/:id', async (req, res) => {
  const inventory = (await readSheet('Inventory')).filter(i => i.id !== req.params.id);
  await writeSheet('Inventory', inventory);
  res.json({ success: true });
});

// ── Summary ───────────────────────────────────────────────────────────────────
app.get('/api/summary', async (req, res) => {
  const [bookings, investments] = await Promise.all([readSheet('Bookings'), readSheet('Investments')]);

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
