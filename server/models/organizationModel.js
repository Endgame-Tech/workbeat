const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true
    },
    industry: {
      type: String,
      required: [true, 'Industry is required']
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      unique: true
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required']
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    settings: {
      workingHours: {
        default: {
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' }
        },
        departments: [{
          name: String,
          start: String,
          end: String
        }]
      },
      gracePeriodsMinutes: { type: Number, default: 5 },
      biometricRequirements: {
        requireFingerprint: { type: Boolean, default: true },
        requireFacial: { type: Boolean, default: true }
      },
      logoUrl: String,
      primaryColor: String,
      secondaryColor: String
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'basic', 'professional', 'enterprise'],
        default: 'free'
      },
      startDate: Date,
      endDate: Date,
      status: {
        type: String,
        enum: ['active', 'trial', 'expired', 'cancelled'],
        default: 'trial'
      },
      maxEmployees: Number,
      features: [String]
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for frequently searched fields
organizationSchema.index({ name: 1 });
organizationSchema.index({ contactEmail: 1 });
organizationSchema.index({ 'subscription.status': 1 });
organizationSchema.index({ isActive: 1 });

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;