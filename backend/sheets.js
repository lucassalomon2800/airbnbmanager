const { google } = require('googleapis');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const NUMERIC_COLUMNS = new Set(['amount', 'nightlyRate', 'quantity', 'parLevel']);

const SCHEMAS = {
  Bookings: ['id', 'guestName', 'checkIn', 'checkOut', 'nightlyRate', 'platform', 'status', 'notes', 'createdAt'],
  Investments: ['id', 'name', 'amount', 'date', 'category', 'createdAt'],
  Inventory: ['id', 'name', 'category', 'quantity', 'parLevel', 'unit', 'createdAt'],
};

function colLetter(index) {
  return String.fromCharCode(65 + index);
}

async function readSheet(tab) {
  const columns = SCHEMAS[tab];
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A2:${colLetter(columns.length - 1)}`,
  });
  const rows = data.values || [];
  return rows
    .filter(row => row.some(cell => cell !== undefined && cell !== ''))
    .map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        const raw = row[i];
        obj[col] = NUMERIC_COLUMNS.has(col) ? Number(raw || 0) : (raw ?? '');
      });
      return obj;
    });
}

async function writeSheet(tab, items) {
  const columns = SCHEMAS[tab];
  const lastCol = colLetter(columns.length - 1);
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A2:${lastCol}`,
  });
  if (items.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${tab}!A2`,
      valueInputOption: 'RAW',
      requestBody: { values: items.map(item => columns.map(col => item[col] ?? '')) },
    });
  }
}

module.exports = { readSheet, writeSheet };
