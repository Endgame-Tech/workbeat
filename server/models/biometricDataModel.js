const mongoose = require('mongoose');

const biometricDataSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    type: {
      type: String,
      enum: ['fingerprint', 'face'],
      required: true
    },
    credentials: [
      {
        id: {
          type: String,
          required: true
        },
        rawId: String,
        type: String,
        response: {
          clientDataJSON: String,
          attestationObject: String,
          authenticatorData: String,
          signature: String,
          userHandle: String
        },
        enrolledAt: {
          type: Date,
          default: Date.now
        },
        lastUsed: Date
      }
    ],
    // For facial recognition
    faceData: {
      faceId: String,
      faceImages: [String],
      faceTemplate: String, // Serialized facial recognition template
      lastUpdated: Date
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'revoked'],
      default: 'active'
    },
    metadata: {
      deviceInfo: String,
      enrollmentSource: String
    },
  },
  {
    timestamps: true
  }
);

// Create indexes for quick lookup
biometricDataSchema.index({ employeeId: 1, type: 1 });
biometricDataSchema.index({ 'credentials.id': 1 });
biometricDataSchema.index({ 'faceData.faceId': 1 });
biometricDataSchema.index({ status: 1 });

const BiometricData = mongoose.model('BiometricData', biometricDataSchema);

module.exports = BiometricData;