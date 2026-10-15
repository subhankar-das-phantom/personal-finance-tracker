const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const walletSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Wallet name is required'],
      trim: true,
      minlength: [1, 'Wallet name cannot be empty'],
      maxlength: [100, 'Wallet name cannot exceed 100 characters'],
    },
    openingBalance: {
      type: Number,
      default: 0,
      set: (val) => Math.round((Number(val) || 0) * 100) / 100,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user wallet queries
walletSchema.index({ user: 1, isArchived: 1 });
walletSchema.index({ user: 1, createdAt: -1 });

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
