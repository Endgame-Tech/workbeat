const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db.js');
const employeeRoutes = require('./routes/employeeRoutes.js');
const attendanceRoutes = require('./routes/attendanceRoutes.js');
const authRoutes = require('./routes/authRoutes.js');
const biometricRoutes = require('./routes/biometricRoutes.js');
const organizationRoutes = require('./routes/organizationRoutes.js');
const employeeAuthRoutes = require('./routes/employeeAuthRoutes.js');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/employee-auth', employeeAuthRoutes);
app.use('/api/biometrics', biometricRoutes);
app.use('/api/organization', organizationRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('WorkBeat API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});