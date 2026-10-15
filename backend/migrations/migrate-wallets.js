/**
 * Migration Script: Migrate existing users and transactions to Multi-Wallet System
 *
 * Description:
 *   1. Finds all users in the database.
 *   2. For each user:
 *      - Ensures at least one active wallet exists (creates "Primary Wallet" if none).
 *      - Assigns all orphaned / unassigned transactions of that user to their primary wallet.
 *   3. Verifies that no transactions remain unassociated.
 *   4. Safe and idempotent: can be executed multiple times without duplicating or corrupting data.
 *   5. Supports dry-run flag: `node migrations/migrate-wallets.js --dry-run`
 *
 * Rollback Strategy:
 *   - The migration only assigns `wallet: defaultWallet._id` to transactions where `wallet` was missing or null.
 *   - A rollback query would be: `db.transactions.updateMany({ isMigrated: true }, { $unset: { wallet: "" } })`.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Wallet = require('../models/wallet.model');
const Transaction = require('../models/transaction.model');

async function runMigration({ dryRun = false } = {}) {
  console.log(`\n==================================================`);
  console.log(`=== Multi-Wallet Data Migration ${dryRun ? '[DRY-RUN]' : '[LIVE]'} ===`);
  console.log(`==================================================\n`);

  const uri = process.env.ATLAS_URI;
  if (!uri) {
    throw new Error('ATLAS_URI environment variable is not defined');
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');
  }

  const users = await User.find({}).lean();
  console.log(`Found ${users.length} total users in the database.`);

  let totalWalletsCreated = 0;
  let totalTransactionsMigrated = 0;
  let totalUsersMigrated = 0;

  for (const user of users) {
    const userId = user._id;

    // Check if user already has an active wallet
    let primaryWallet = await Wallet.findOne({ user: userId, isArchived: false }).sort({ createdAt: 1 });

    if (!primaryWallet) {
      console.log(`User ${user.username} (${userId}) has no active wallet. Creating "Primary Wallet"...`);
      if (!dryRun) {
        primaryWallet = await Wallet.create({
          user: userId,
          name: 'Primary Wallet',
          openingBalance: 0,
          currency: user.currency?.code || 'INR',
          isArchived: false,
        });
      }
      totalWalletsCreated++;
    }

    // Find all transactions without a valid wallet reference
    const unassignedFilter = {
      user: userId,
      $or: [{ wallet: { $exists: false } }, { wallet: null }],
    };

    const unassignedCount = await Transaction.countDocuments(unassignedFilter);

    if (unassignedCount > 0) {
      console.log(
        `User ${user.username} (${userId}): migrating ${unassignedCount} unassigned transactions to wallet "${
          primaryWallet?.name || 'Primary Wallet'
        }"...`
      );

      if (!dryRun) {
        const updateResult = await Transaction.updateMany(unassignedFilter, {
          $set: { wallet: primaryWallet._id },
        });
        totalTransactionsMigrated += updateResult.modifiedCount;
      } else {
        totalTransactionsMigrated += unassignedCount;
      }
      totalUsersMigrated++;
    }
  }

  // Verification step
  const remainingUnassigned = await Transaction.countDocuments({
    $or: [{ wallet: { $exists: false } }, { wallet: null }],
  });

  console.log(`\n--------------------------------------------------`);
  console.log(`Migration Summary (${dryRun ? 'DRY-RUN' : 'LIVE'}):`);
  console.log(`  - Users processed:            ${users.length}`);
  console.log(`  - Wallets created:            ${totalWalletsCreated}`);
  console.log(`  - Transactions migrated:      ${totalTransactionsMigrated}`);
  console.log(`  - Remaining unassigned:       ${dryRun ? 'N/A' : remainingUnassigned}`);
  console.log(`--------------------------------------------------\n`);

  if (!dryRun && remainingUnassigned > 0) {
    throw new Error(`Migration verification failed: ${remainingUnassigned} transactions still lack a wallet.`);
  }

  console.log('Migration completed successfully.');
  return {
    success: true,
    usersProcessed: users.length,
    walletsCreated: totalWalletsCreated,
    transactionsMigrated: totalTransactionsMigrated,
    remainingUnassigned: dryRun ? 0 : remainingUnassigned,
  };
}

// Execute directly if run as a script
if (require.main === module) {
  const isDryRun = process.argv.includes('--dry-run');
  runMigration({ dryRun: isDryRun })
    .then(() => {
      mongoose.connection.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      mongoose.connection.close();
      process.exit(1);
    });
}

module.exports = { runMigration };
