const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' })); // Adjust to match Vite frontend
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'DB connected' }));

// Routes
const authRoutes = require('./routes/auth');
const transfersRoutes = require('./routes/transfers');
const purchasesRoutes = require('./routes/purchases');
const assignmentsRoutes = require('./routes/assignments');
const expendituresRoutes = require('./routes/expenditures');
const dashboardRoutes = require('./routes/dashboard');
const globalsRoutes = require('./routes/globals');
const auditRoutes = require('./routes/audit');
const usersRoutes = require('./routes/users');
const inventoryRoutes = require('./routes/inventory');

app.use('/api/auth', authRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/expenditures', expendituresRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/globals', globalsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/inventory', inventoryRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

module.exports = app;
