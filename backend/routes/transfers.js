const router = require('express').Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Transfer = require('../models/transfer.model');
const Wallet = require('../models/wallet.model');

// Helper to get wallet balance
async function calculateWalletBalance(walletId, userId) {
  const Transaction = require('../models/transaction.model');
  const wId = new mongoose.Types.ObjectId(walletId);
  const uId = new mongoose.Types.ObjectId(userId);

  const wallet = await Wallet.findOne({ _id: wId, user: uId }).lean();
  if (!wallet) return null;

  const [incomeAgg, expenseAgg, inAgg, outAgg] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: uId, wallet: wId, type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { user: uId, wallet: wId, type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transfer.aggregate([
      { $match: { user: uId, toWallet: wId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transfer.aggregate([
      { $match: { user: uId, fromWallet: wId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const opening = Number(wallet.openingBalance) || 0;
  const income = incomeAgg[0]?.total || 0;
  const expense = expenseAgg[0]?.total || 0;
  const transfersIn = inAgg[0]?.total || 0;
  const transfersOut = outAgg[0]?.total || 0;

  return Math.round((opening + income - expense + transfersIn - transfersOut) * 100) / 100;
}

// 1. Get all transfers for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { walletId, dateFrom, dateTo, page, pageSize } = req.query;

    const filter = { user: req.user };

    if (walletId) {
      if (!mongoose.Types.ObjectId.isValid(walletId)) {
        return res.status(400).json({ message: 'Invalid wallet ID format' });
      }
      const wObjectId = new mongoose.Types.ObjectId(walletId);
      filter.$or = [{ fromWallet: wObjectId }, { toWallet: wObjectId }];
    }

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    let query = Transfer.find(filter)
      .populate('fromWallet', 'name currency isArchived')
      .populate('toWallet', 'name currency isArchived')
      .sort({ date: -1, createdAt: -1 });

    if (page && pageSize) {
      const p = Math.max(1, parseInt(page, 10) || 1);
      const ps = Math.max(1, parseInt(pageSize, 10) || 20);
      const skip = (p - 1) * ps;

      const [transfers, totalCount] = await Promise.all([
        query.skip(skip).limit(ps).lean(),
        Transfer.countDocuments(filter),
      ]);

      return res.json({
        transfers,
        pagination: {
          page: p,
          pageSize: ps,
          totalCount,
          totalPages: Math.ceil(totalCount / ps),
          hasMore: skip + transfers.length < totalCount,
        },
      });
    }

    const transfers = await query.lean();
    res.json(transfers);
  } catch (err) {
    console.error('Error fetching transfers:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get single transfer
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid transfer ID format' });
    }

    const transfer = await Transfer.findOne({ _id: req.params.id, user: req.user })
      .populate('fromWallet', 'name currency isArchived')
      .populate('toWallet', 'name currency isArchived')
      .lean();

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found or unauthorized' });
    }

    res.json(transfer);
  } catch (err) {
    console.error('Error fetching transfer:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Create a new transfer
router.post('/', auth, async (req, res) => {
  try {
    const { fromWalletId, toWalletId, amount, date, description, idempotencyKey } = req.body;

    // Idempotency check: if key provided and already processed, return existing
    if (idempotencyKey && typeof idempotencyKey === 'string' && idempotencyKey.trim()) {
      const existing = await Transfer.findOne({
        user: req.user,
        idempotencyKey: idempotencyKey.trim(),
      })
        .populate('fromWallet', 'name currency')
        .populate('toWallet', 'name currency')
        .lean();

      if (existing) {
        return res.status(200).json({
          ...existing,
          isDuplicate: true,
          message: 'Transfer already processed (idempotent replay)',
        });
      }
    }

    // Validation 1: fromWallet and toWallet must be provided and valid
    if (!fromWalletId || !toWalletId) {
      return res.status(400).json({ message: 'Both source and destination wallets are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(fromWalletId) || !mongoose.Types.ObjectId.isValid(toWalletId)) {
      return res.status(400).json({ message: 'Invalid wallet ID format' });
    }

    // Validation 2: Source and destination must be different
    if (fromWalletId.toString() === toWalletId.toString()) {
      return res.status(400).json({ message: 'Source and destination wallets must be different' });
    }

    // Validation 3: Amount must be a positive number
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Transfer amount must be a positive number greater than 0' });
    }

    const roundedAmount = Math.round(numAmount * 100) / 100;
    if (roundedAmount < 0.01) {
      return res.status(400).json({ message: 'Transfer amount must be at least 0.01' });
    }

    // Validation 4: Fetch both wallets and verify ownership
    const [fromWallet, toWallet] = await Promise.all([
      Wallet.findOne({ _id: fromWalletId, user: req.user }),
      Wallet.findOne({ _id: toWalletId, user: req.user }),
    ]);

    if (!fromWallet) {
      return res.status(404).json({ message: 'Source wallet not found or unauthorized' });
    }

    if (!toWallet) {
      return res.status(404).json({ message: 'Destination wallet not found or unauthorized' });
    }

    // Validation 5: Neither wallet can be archived
    if (fromWallet.isArchived) {
      return res.status(400).json({ message: `Source wallet "${fromWallet.name}" is archived and cannot send funds` });
    }

    if (toWallet.isArchived) {
      return res.status(400).json({ message: `Destination wallet "${toWallet.name}" is archived and cannot receive funds` });
    }

    // Validation 6: Currency compatibility
    if (fromWallet.currency !== toWallet.currency) {
      return res.status(400).json({
        message: `Cross-currency transfers (${fromWallet.currency} to ${toWallet.currency}) are not supported without currency conversion.`,
      });
    }

    // Validation 7: Date validity
    let transferDate = new Date();
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid transfer date format' });
      }
      transferDate = parsedDate;
    }

    // Check source wallet current balance for informational feedback
    const currentFromBalance = await calculateWalletBalance(fromWalletId, req.user);
    const balanceRemaining = Math.round((currentFromBalance - roundedAmount) * 100) / 100;

    // Create transfer document
    const newTransfer = new Transfer({
      user: req.user,
      fromWallet: fromWallet._id,
      toWallet: toWallet._id,
      amount: roundedAmount,
      date: transferDate,
      description: (description || '').trim(),
      idempotencyKey: idempotencyKey ? idempotencyKey.trim() : undefined,
    });

    const savedTransfer = await newTransfer.save();

    // Populate wallet details for the response
    const populated = await Transfer.findById(savedTransfer._id)
      .populate('fromWallet', 'name currency isArchived')
      .populate('toWallet', 'name currency isArchived')
      .lean();

    res.status(201).json({
      ...populated,
      sourceWalletRemainingBalance: balanceRemaining,
      warning: balanceRemaining < 0 ? 'Source wallet balance is now negative' : null,
    });
  } catch (err) {
    // Handle duplicate key error for idempotencyKey
    if (err.code === 11000 && req.body?.idempotencyKey && typeof req.body.idempotencyKey === 'string') {
      try {
        const existing = await Transfer.findOne({
          user: req.user,
          idempotencyKey: req.body.idempotencyKey.trim(),
        })
          .populate('fromWallet', 'name currency')
          .populate('toWallet', 'name currency')
          .lean();

        if (existing) {
          return res.status(200).json({
            ...existing,
            isDuplicate: true,
            message: 'Transfer already processed (concurrent idempotent replay)',
          });
        }
      } catch (findErr) {
        console.error('Error finding existing idempotent transfer:', findErr);
      }
    }

    console.error('Error creating transfer:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4. Delete / Revert transfer
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid transfer ID format' });
    }

    const transfer = await Transfer.findOneAndDelete({ _id: req.params.id, user: req.user });
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found or unauthorized' });
    }

    res.json({ message: 'Transfer deleted successfully', transferId: req.params.id });
  } catch (err) {
    console.error('Error deleting transfer:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
