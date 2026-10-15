const router = require('express').Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Wallet = require('../models/wallet.model');
const Transaction = require('../models/transaction.model');
const Transfer = require('../models/transfer.model');
const User = require('../models/user.model');

// Helper to calculate balances for a list of wallets of a user
async function getWalletsWithBalances(userId, includeArchived = false) {
  const query = { user: userId };
  if (!includeArchived) {
    query.isArchived = false;
  }

  const wallets = await Wallet.find(query).sort({ createdAt: 1 }).lean();

  if (wallets.length === 0) {
    return { wallets: [], summary: { totalBalance: 0, totalIncome: 0, totalExpenses: 0, totalOpeningBalance: 0 } };
  }

  const walletIds = wallets.map((w) => w._id);

  // Aggregate transaction totals grouped by wallet and type
  const txStats = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), wallet: { $in: walletIds } } },
    {
      $group: {
        _id: { wallet: '$wallet', type: '$type' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Aggregate transfers in
  const transfersInStats = await Transfer.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), toWallet: { $in: walletIds } } },
    {
      $group: {
        _id: '$toWallet',
        totalIn: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Aggregate transfers out
  const transfersOutStats = await Transfer.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), fromWallet: { $in: walletIds } } },
    {
      $group: {
        _id: '$fromWallet',
        totalOut: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Map aggregates to wallet IDs
  const txMap = {};
  txStats.forEach((stat) => {
    const wId = stat._id.wallet.toString();
    if (!txMap[wId]) txMap[wId] = { income: 0, expense: 0, txCount: 0 };
    if (stat._id.type === 'income') {
      txMap[wId].income = Math.round(stat.totalAmount * 100) / 100;
    } else if (stat._id.type === 'expense') {
      txMap[wId].expense = Math.round(stat.totalAmount * 100) / 100;
    }
    txMap[wId].txCount += stat.count;
  });

  const inMap = {};
  transfersInStats.forEach((t) => {
    inMap[t._id.toString()] = { totalIn: Math.round(t.totalIn * 100) / 100, count: t.count };
  });

  const outMap = {};
  transfersOutStats.forEach((t) => {
    outMap[t._id.toString()] = { totalOut: Math.round(t.totalOut * 100) / 100, count: t.count };
  });

  let totalOpeningBalance = 0;
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalBalance = 0;

  const enrichedWallets = wallets.map((wallet) => {
    const wId = wallet._id.toString();
    const opening = Math.round((Number(wallet.openingBalance) || 0) * 100) / 100;
    const income = txMap[wId]?.income || 0;
    const expense = txMap[wId]?.expense || 0;
    const transfersIn = inMap[wId]?.totalIn || 0;
    const transfersOut = outMap[wId]?.totalOut || 0;

    const currentBalance = Math.round((opening + income - expense + transfersIn - transfersOut) * 100) / 100;
    const transactionCount = txMap[wId]?.txCount || 0;
    const transferCount = (inMap[wId]?.count || 0) + (outMap[wId]?.count || 0);

    // Sum active wallets for summary
    if (!wallet.isArchived) {
      totalOpeningBalance += opening;
      totalIncome += income;
      totalExpenses += expense;
      totalBalance += currentBalance;
    }

    return {
      ...wallet,
      balance: currentBalance,
      income,
      expense,
      transfersIn,
      transfersOut,
      transactionCount,
      transferCount,
    };
  });

  return {
    wallets: enrichedWallets,
    summary: {
      totalBalance: Math.round(totalBalance * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalOpeningBalance: Math.round(totalOpeningBalance * 100) / 100,
      count: enrichedWallets.filter((w) => !w.isArchived).length,
    },
  };
}

// 1. Get all wallets for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === 'true' || req.query.all === 'true';

    // Auto-create default wallet if user has none
    const existingCount = await Wallet.countDocuments({ user: req.user });
    if (existingCount === 0) {
      const user = await User.findById(req.user).lean();
      const defaultWallet = await Wallet.create({
        user: req.user,
        name: 'Primary Wallet',
        openingBalance: 0,
        currency: user?.currency?.code || 'INR',
        isArchived: false,
      });

      // Migrate any existing unassigned transactions
      await Transaction.updateMany(
        { user: req.user, $or: [{ wallet: { $exists: false } }, { wallet: null }] },
        { $set: { wallet: defaultWallet._id } }
      );
    }

    const result = await getWalletsWithBalances(req.user, includeArchived);
    res.json(result);
  } catch (err) {
    console.error('Error fetching wallets:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get single wallet by ID
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid wallet ID format' });
    }

    const wallet = await Wallet.findOne({ _id: req.params.id, user: req.user }).lean();
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found or unauthorized' });
    }

    const wId = wallet._id;
    const userId = new mongoose.Types.ObjectId(req.user);

    // Dynamic balance calculations
    const [incomeAgg, expenseAgg, inAgg, outAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, wallet: wId, type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, wallet: wId, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Transfer.aggregate([
        { $match: { user: userId, toWallet: wId } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Transfer.aggregate([
        { $match: { user: userId, fromWallet: wId } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const opening = Math.round((Number(wallet.openingBalance) || 0) * 100) / 100;
    const income = incomeAgg[0]?.total || 0;
    const expense = expenseAgg[0]?.total || 0;
    const transfersIn = inAgg[0]?.total || 0;
    const transfersOut = outAgg[0]?.total || 0;
    const balance = Math.round((opening + income - expense + transfersIn - transfersOut) * 100) / 100;

    res.json({
      ...wallet,
      balance,
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      transfersIn: Math.round(transfersIn * 100) / 100,
      transfersOut: Math.round(transfersOut * 100) / 100,
      transactionCount: (incomeAgg[0]?.count || 0) + (expenseAgg[0]?.count || 0),
      transferCount: (inAgg[0]?.count || 0) + (outAgg[0]?.count || 0),
    });
  } catch (err) {
    console.error('Error fetching single wallet:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Create a new wallet
router.post('/', auth, async (req, res) => {
  try {
    const { name, openingBalance = 0, currency } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Wallet name is required' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).json({ message: 'Wallet name cannot exceed 100 characters' });
    }

    const parsedBalance = Number(openingBalance);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      return res.status(400).json({ message: 'Opening balance must be a non-negative number' });
    }

    const user = await User.findById(req.user).lean();
    const finalCurrency = (currency || user?.currency?.code || 'INR').toUpperCase().trim();

    const newWallet = new Wallet({
      user: req.user,
      name: trimmedName,
      openingBalance: Math.round(parsedBalance * 100) / 100,
      currency: finalCurrency,
      isArchived: false,
    });

    const savedWallet = await newWallet.save();

    res.status(201).json({
      ...savedWallet.toObject(),
      balance: savedWallet.openingBalance,
      income: 0,
      expense: 0,
      transfersIn: 0,
      transfersOut: 0,
      transactionCount: 0,
      transferCount: 0,
    });
  } catch (err) {
    console.error('Error creating wallet:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Update / Rename wallet
router.put('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid wallet ID format' });
    }

    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Wallet name is required' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).json({ message: 'Wallet name cannot exceed 100 characters' });
    }

    const wallet = await Wallet.findOne({ _id: req.params.id, user: req.user });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found or unauthorized' });
    }

    wallet.name = trimmedName;
    const updatedWallet = await wallet.save();

    res.json(updatedWallet);
  } catch (err) {
    console.error('Error updating wallet:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH alias for update
router.patch('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid wallet ID format' });
    }

    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Wallet name is required' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).json({ message: 'Wallet name cannot exceed 100 characters' });
    }

    const wallet = await Wallet.findOne({ _id: req.params.id, user: req.user });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found or unauthorized' });
    }

    wallet.name = trimmedName;
    const updatedWallet = await wallet.save();

    res.json(updatedWallet);
  } catch (err) {
    console.error('Error updating wallet:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Archive wallet
router.post('/:id/archive', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid wallet ID format' });
    }

    const wallet = await Wallet.findOne({ _id: req.params.id, user: req.user });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found or unauthorized' });
    }

    // Check if it's the only active wallet
    const activeCount = await Wallet.countDocuments({ user: req.user, isArchived: false });
    if (activeCount <= 1 && !wallet.isArchived) {
      return res.status(400).json({
        message: 'Cannot archive your only active wallet. Please create or activate another wallet first.',
      });
    }

    wallet.isArchived = true;
    await wallet.save();

    res.json({ message: 'Wallet archived successfully', wallet });
  } catch (err) {
    console.error('Error archiving wallet:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Unarchive wallet
router.post('/:id/unarchive', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid wallet ID format' });
    }

    const wallet = await Wallet.findOne({ _id: req.params.id, user: req.user });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found or unauthorized' });
    }

    wallet.isArchived = false;
    await wallet.save();

    res.json({ message: 'Wallet restored successfully', wallet });
  } catch (err) {
    console.error('Error unarchiving wallet:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Delete wallet (Safe deletion rule: only if no transaction or transfer history)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid wallet ID format' });
    }

    const wallet = await Wallet.findOne({ _id: req.params.id, user: req.user });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found or unauthorized' });
    }

    // Check transaction and transfer history
    const [txCount, transferCount] = await Promise.all([
      Transaction.countDocuments({ wallet: wallet._id }),
      Transfer.countDocuments({
        $or: [{ fromWallet: wallet._id }, { toWallet: wallet._id }],
      }),
    ]);

    if (txCount > 0 || transferCount > 0) {
      return res.status(400).json({
        message:
          'Cannot delete a wallet that has transaction or transfer history. Please archive it instead to preserve your financial records.',
        transactionCount: txCount,
        transferCount: transferCount,
        suggestArchive: true,
      });
    }

    await Wallet.findByIdAndDelete(wallet._id);
    res.json({ message: 'Wallet deleted successfully' });
  } catch (err) {
    console.error('Error deleting wallet:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
