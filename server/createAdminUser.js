/**
 * Script to create an admin user for WorkBeat
 * Run this script with Node.js: node createAdminUser.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB connection string (use the same as in your main app)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/workbeat';

// Define User Schema (must match your actual User model)
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false // Don't return password by default
    },
    name: {
      type: String,
      required: [true, 'Name is required']
    },
    role: {
      type: String,
      enum: ['admin', 'employee'],
      default: 'employee'
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    lastLogin: {
      type: Date
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  {
    timestamps: true
  }
);

// Method to hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Register the model
const User = mongoose.model('User', userSchema);

// Admin user credentials
const adminUser = {
  name: 'Admin',
  email: 'admin@workbeat.com',
  password: 'admin123',
  role: 'admin'
};

// Function to create admin user
const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    
    if (existingAdmin) {
      console.log('Admin user already exists. No need to create a new one.');
    } else {
      // Create the admin user
      const user = await User.create(adminUser);
      console.log(`Admin user created successfully with ID: ${user._id}`);
    }

    // Create a default employee user as well
    const employeeUser = {
      name: 'Employee',
      email: 'employee@workbeat.com',
      password: 'employee123',
      role: 'employee'
    };

    const existingEmployee = await User.findOne({ email: employeeUser.email });
    
    if (existingEmployee) {
      console.log('Employee user already exists. No need to create a new one.');
    } else {
      // Create the employee user
      const user = await User.create(employeeUser);
      console.log(`Employee user created successfully with ID: ${user._id}`);
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected...');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

// Run the function
createAdmin();