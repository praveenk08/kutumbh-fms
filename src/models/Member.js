const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: [true, 'Parent family reference ID is required'],
      index: true,
    },
    memberReferenceId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
    },
    relationshipWithHead: {
      type: String,
      required: [true, 'Relationship with head is required'],
      enum: ['Self', 'Spouse', 'Son', 'Daughter', 'Mother', 'Father', 'Brother', 'Daughter-in-Law', 'Other'],
    },
    gender: {
      type: String,
      required: true,
      enum: ['Male', 'Female', 'Transgender'],
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 125,
    },
    educationalQualification: {
      type: String,
      enum: ['Illiterate', 'Primary', 'Middle', 'HighSchool', 'Intermediate', 'Graduate', 'PostGraduate', 'Professional'],
      default: 'Primary',
    },
    primaryOccupation: {
      type: String,
      trim: true,
      default: 'Unemployed/Student',
    },
    individualAadhaarStatus: {
      isEnrolled: { type: Boolean, default: true },
    },
    // Soft delete aur audit tracking ke liye zaroori fields:
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    remarks: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique ordering inside a family unit
memberSchema.index({ familyId: 1, relationshipWithHead: 1 });

module.exports = mongoose.model('Member', memberSchema);