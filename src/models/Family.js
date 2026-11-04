const mongoose = require('mongoose');

const familySchema = new mongoose.Schema(
  {
    familyToken: {
      type: String,
      required: [true, 'Family token is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    headName: {
      type: String,
      required: [true, 'Family head name is required'],
      trim: true,
    },
    guardianName: {
      type: String,
      required: [true, 'Father or husband name is required'],
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
      index: true,
    },
    habitation: {
      village: { type: String, default: 'Rustampur', trim: true },
      block: { type: String, default: 'Dubhar', trim: true },
      district: { type: String, default: 'Ballia', trim: true },
      tolaMohalla: { type: String, required: true, trim: true },
    },
    categoryDetails: {
      community: { type: String, default: 'Gond', trim: true },
      subCaste: { type: String, default: 'Gond/Dhuria/Nayak', trim: true },
      casteCertificateNumber: { type: String, default: null, trim: true },
      isCertificateIssued: { type: Boolean, default: false },
    },
    economicProfile: {
      rationCardCategory: {
        type: String,
        enum: ['Antyodaya', 'BPL', 'APL', 'None'],
        default: 'None',
      },
      housingType: {
        type: String,
        enum: ['Kaccha', 'Semi-Pucca', 'Pucca', 'PM_Awas_Beneficiary'],
        default: 'Kaccha',
      },
      isMigrantFamily: {
        type: Boolean,
        default: false,
      },
      migrationCity: {
        type: String,
        default: null,
      },
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'FLAGGED_FOR_REVIEW', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate to fetch all related family members efficiently (DRY)
familySchema.virtual('members', {
  ref: 'Member',
  localField: '_id',
  foreignField: 'familyId',
});

module.exports = mongoose.model('Family', familySchema);