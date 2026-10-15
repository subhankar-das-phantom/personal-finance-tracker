const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const transferSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fromWallet: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Source wallet is required'],
      index: true,
    },
    toWallet: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Destination wallet is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transfer amount is required'],
      min: [0.01, 'Transfer amount must be at least 0.01'],
      set: (val) => Math.round((Number(val) || 0) * 100) / 100,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
transferSchema.index({ user: 1, date: -1 });
transferSchema.index({ fromWallet: 1, date: -1 });
transferSchema.index({ toWallet: 1, date: -1 });
transferSchema.index(
  { user: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

const Transfer = mongoose.model('Transfer', transferSchema);

module.exports = Transfer;
