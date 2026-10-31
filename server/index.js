const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config/config');
const { seedDatabase } = require('./seed');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee');
const adminRoutes = require('./routes/admin');
const reportsRoutes = require('./routes/reports');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, same-origin)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/export', reportsRoutes);

// Serve React build in production
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexHtml = path.join(clientDist, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) next();
  });
});

async function start() {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log('MongoDB connected');
    await seedDatabase();

    app.listen(config.PORT, () => {
      console.log(`Server running on http://127.0.0.1:${config.PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
