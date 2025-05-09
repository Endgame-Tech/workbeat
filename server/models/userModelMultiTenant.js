const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    // ... existing user fields ...
    
    // Add specific roles for organization management
    organizationRole: {
      type: String,
      enum: ['owner', 'admin', 'manager', 'user'],
      default: 'user'
    }
  },
  {
    timestamps: true
  }
);

// Add compound index for org users
userSchema.index({ organizationId: 1, email: 1 }, { unique: true });

// Existing methods for password hashing etc.

const User = mongoose.model('User', userSchema);

module.exports = User;