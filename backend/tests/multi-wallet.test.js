const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = require('../server');
const User = require('../models/user.model');
const Wallet = require('../models/wallet.model');
const Transaction = require('../models/transaction.model');
const Transfer = require('../models/transfer.model');
const { runMigration } = require('../migrations/migrate-wallets');

let server;
let baseUrl;
let testUserA;
let tokenA;
let testUserB;
let tokenB;

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function createToken(userId) {
  return jwt.sign({ id: userId.toString() }, JWT_SECRET, { expiresIn: '1h' });
}

async function apiRequest(endpoint, { method = 'GET', body = null, token = null } = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  let data;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { status: response.status, data, headers: response.headers };
}

describe('Custom Multi-Wallet System - Full Test Suite (Scenarios 1-20)', { concurrency: 1 }, () => {
  before(async () => {
    // Wait for mongoose connection if not yet ready
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.ATLAS_URI, {
        serverSelectionTimeoutMS: 15000,
      });
    }

    // Sync transfer indexes to ensure partialFilterExpression is active
    try {
      await Transfer.collection.dropIndex('user_1_idempotencyKey_1');
    } catch {
      // ignore if not present
    }
    await Transfer.syncIndexes();

    // Start HTTP server on ephemeral port
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Create unique test users
    const rand = Date.now();
    testUserA = await User.create({
      username: `test_user_a_${rand}`,
      email: `test_a_${rand}@example.com`,
      password: 'password123_hash',
      currency: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    });
    tokenA = createToken(testUserA._id);

    testUserB = await User.create({
      username: `test_user_b_${rand}`,
      email: `test_b_${rand}@example.com`,
      password: 'password123_hash',
      currency: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    });
    tokenB = createToken(testUserB._id);
  });

  after(async () => {
    // Clean up test data created for User A and User B
    if (testUserA) {
      await Transaction.deleteMany({ user: testUserA._id });
      await Transfer.deleteMany({ user: testUserA._id });
      await Wallet.deleteMany({ user: testUserA._id });
      await User.deleteOne({ _id: testUserA._id });
    }
    if (testUserB) {
      await Transaction.deleteMany({ user: testUserB._id });
      await Transfer.deleteMany({ user: testUserB._id });
      await Wallet.deleteMany({ user: testUserB._id });
      await User.deleteOne({ _id: testUserB._id });
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  let walletA1;
  let walletA2;
  let walletA3;

  // Scenario 1: Create and rename wallets
  it('Scenario 1: Should create a wallet and rename it successfully', async () => {
    const res = await apiRequest('/api/wallets', {
      method: 'POST',
      body: { name: 'Main Savings', openingBalance: 1000 },
      token: tokenA,
    });
    assert.strictEqual(res.status, 201, 'Should return 201 Created');
    const createdWallet = res.data.wallet || res.data;
    assert.strictEqual(createdWallet.name, 'Main Savings');
    assert.strictEqual(createdWallet.openingBalance, 1000);
    assert.strictEqual(createdWallet.balance, 1000);
    walletA1 = createdWallet;

    // Rename wallet
    const renameRes = await apiRequest(`/api/wallets/${walletA1._id}`, {
      method: 'PATCH',
      body: { name: 'Boro Purse' },
      token: tokenA,
    });
    assert.strictEqual(renameRes.status, 200, 'Should return 200 OK');
    const updatedWallet = renameRes.data.wallet || renameRes.data;
    assert.strictEqual(updatedWallet.name, 'Boro Purse');
    walletA1.name = 'Boro Purse';
  });

  // Scenario 2: Support multilingual wallet names
  it('Scenario 2: Should support multilingual wallet names (Bengali, Hindi, Gujarati, Emojis)', async () => {
    const names = [
      'আমার জমানো টাকা 💰',
      'घर का पैसा',
      'મુસાફરી ભંડોળ',
      'Chhoto Purse 👛',
    ];

    for (const name of names) {
      const res = await apiRequest('/api/wallets', {
        method: 'POST',
        body: { name, openingBalance: 500 },
        token: tokenA,
      });
      assert.strictEqual(res.status, 201, `Failed to create wallet with name: ${name}`);
      const w = res.data.wallet || res.data;
      assert.strictEqual(w.name, name);
      if (name.includes('Chhoto Purse')) {
        walletA2 = w;
      }
    }
  });

  // Scenario 3: Allow duplicate names if that is the chosen policy
  it('Scenario 3: Should allow duplicate wallet names with distinct IDs for the same user', async () => {
    const res1 = await apiRequest('/api/wallets', {
      method: 'POST',
      body: { name: 'Emergency Fund', openingBalance: 200 },
      token: tokenA,
    });
    const res2 = await apiRequest('/api/wallets', {
      method: 'POST',
      body: { name: 'Emergency Fund', openingBalance: 300 },
      token: tokenA,
    });

    assert.strictEqual(res1.status, 201);
    assert.strictEqual(res2.status, 201);
    const w1 = res1.data.wallet || res1.data;
    const w2 = res2.data.wallet || res2.data;
    assert.strictEqual(w1.name, w2.name);
    assert.notStrictEqual(w1._id.toString(), w2._id.toString());
    walletA3 = w1;
  });

  // Scenario 4: Record income and expenses in different wallets
  it('Scenario 4: Should record income and expenses assigned to specific wallets', async () => {
    // Record income in walletA1 (Boro Purse: 1000 opening + 5000 salary = 6000)
    const incomeRes = await apiRequest('/api/transactions', {
      method: 'POST',
      body: {
        description: 'Tech Consulting Salary',
        amount: 5000,
        type: 'income',
        category: 'Salary',
        date: new Date().toISOString(),
        walletId: walletA1._id,
      },
      token: tokenA,
    });
    assert.strictEqual(incomeRes.status, 201);
    const incTx = incomeRes.data.transaction || incomeRes.data;
    const incWalletId = incTx.wallet?._id ? incTx.wallet._id.toString() : incTx.wallet?.toString();
    assert.strictEqual(incWalletId, walletA1._id.toString());

    // Record expense in walletA2 (Chhoto Purse: 500 opening - 150 groceries = 350)
    const expenseRes = await apiRequest('/api/transactions', {
      method: 'POST',
      body: {
        description: 'Weekly Groceries',
        amount: 150,
        type: 'expense',
        category: 'Food & Dining',
        date: new Date().toISOString(),
        walletId: walletA2._id,
      },
      token: tokenA,
    });
    assert.strictEqual(expenseRes.status, 201);
  });

  // Scenario 5: Verify wallet-specific balances
  it('Scenario 5: Should verify accurate wallet-specific balances derived from transactions', async () => {
    const res = await apiRequest('/api/wallets', { token: tokenA });
    assert.strictEqual(res.status, 200);

    const w1 = res.data.wallets.find((w) => w._id.toString() === walletA1._id.toString());
    const w2 = res.data.wallets.find((w) => w._id.toString() === walletA2._id.toString());

    // w1: 1000 opening + 5000 income = 6000
    assert.strictEqual(w1.balance, 6000);
    // w2: 500 opening - 150 expense = 350
    assert.strictEqual(w2.balance, 350);
  });

  // Scenario 6: Verify combined balances
  it('Scenario 6: Should accurately aggregate total combined balance across all user wallets', async () => {
    const res = await apiRequest('/api/wallets', { token: tokenA });
    const calculatedSum = res.data.wallets.reduce((acc, w) => acc + w.balance, 0);
    assert.strictEqual(res.data.summary.totalBalance, Math.round(calculatedSum * 100) / 100);
    assert.strictEqual(res.data.summary.totalIncome, 5000);
    assert.strictEqual(res.data.summary.totalExpenses, 150);
  });

  // Scenario 7: Transfer money between wallets
  let transferRecord;
  it('Scenario 7: Should transfer money between two wallets owned by the user', async () => {
    const res = await apiRequest('/api/transfers', {
      method: 'POST',
      body: {
        fromWalletId: walletA1._id,
        toWalletId: walletA2._id,
        amount: 1000,
        description: 'Fund Chhoto Purse from Boro Purse',
      },
      token: tokenA,
    });

    assert.strictEqual(res.status, 201, 'Transfer creation should succeed');
    const tr = res.data.transfer || res.data;
    assert.strictEqual(tr.amount, 1000);
    transferRecord = tr;

    // Verify updated balances:
    // w1: 6000 - 1000 = 5000
    // w2: 350 + 1000 = 1350
    const walletsRes = await apiRequest('/api/wallets', { token: tokenA });
    const w1 = walletsRes.data.wallets.find((w) => w._id.toString() === walletA1._id.toString());
    const w2 = walletsRes.data.wallets.find((w) => w._id.toString() === walletA2._id.toString());
    assert.strictEqual(w1.balance, 5000);
    assert.strictEqual(w2.balance, 1350);
  });

  // Scenario 8: Verify transfer effects on both histories
  it('Scenario 8: Should show transfer in both source and destination wallet histories', async () => {
    const fromHist = await apiRequest(`/api/transfers?walletId=${walletA1._id}`, { token: tokenA });
    const toHist = await apiRequest(`/api/transfers?walletId=${walletA2._id}`, { token: tokenA });

    assert.strictEqual(fromHist.status, 200);
    assert.strictEqual(toHist.status, 200);

    const fromList = Array.isArray(fromHist.data) ? fromHist.data : (fromHist.data.transfers || []);
    const toList = Array.isArray(toHist.data) ? toHist.data : (toHist.data.transfers || []);

    const fromMatch = fromList.find((t) => t._id.toString() === transferRecord._id.toString());
    const toMatch = toList.find((t) => t._id.toString() === transferRecord._id.toString());

    assert.ok(fromMatch, 'Transfer should appear in source wallet history');
    assert.ok(toMatch, 'Transfer should appear in destination wallet history');
    assert.strictEqual(fromMatch._id.toString(), toMatch._id.toString(), 'Both histories must reference the same transfer entity');
  });

  // Scenario 9: Verify transfers do not affect income, expenses or combined balance
  it('Scenario 9: Transfers must not alter income, expenses, or net combined balance', async () => {
    const walletsRes = await apiRequest('/api/wallets', { token: tokenA });
    assert.strictEqual(walletsRes.data.summary.totalIncome, 5000, 'Income must remain 5000');
    assert.strictEqual(walletsRes.data.summary.totalExpenses, 150, 'Expenses must remain 150');

    // Also check transactions stats endpoint
    const statsRes = await apiRequest('/api/transactions/stats', { token: tokenA });
    assert.strictEqual(statsRes.data.totalIncomeAllTime, 5000);
    assert.strictEqual(statsRes.data.totalExpensesAllTime, 150);
    assert.strictEqual(statsRes.data.netBalanceAllTime, Math.round((statsRes.data.openingBalance + 5000 - 150) * 100) / 100);
  });

  // Scenario 10: Reject same-wallet transfers
  it('Scenario 10: Should reject same-wallet transfers with 400 Bad Request', async () => {
    const res = await apiRequest('/api/transfers', {
      method: 'POST',
      body: {
        fromWalletId: walletA1._id,
        toWalletId: walletA1._id,
        amount: 100,
      },
      token: tokenA,
    });
    assert.strictEqual(res.status, 400);
    assert.match(res.data.message, /different/i);
  });

  // Scenario 11: Reject invalid amounts
  it('Scenario 11: Should reject negative, zero, and malformed transfer amounts', async () => {
    const invalidAmounts = [-50, 0, 'abc'];
    for (const amt of invalidAmounts) {
      const res = await apiRequest('/api/transfers', {
        method: 'POST',
        body: {
          fromWalletId: walletA1._id,
          toWalletId: walletA2._id,
          amount: amt,
        },
        token: tokenA,
      });
      assert.strictEqual(res.status, 400, `Expected 400 for amount: ${amt}`);
    }
  });

  // Scenario 12: Reject unauthorized cross-user access
  it('Scenario 12: Should prevent User B from accessing, modifying, or transferring to/from User A wallets', async () => {
    // User B tries to view User A's wallet
    const getRes = await apiRequest(`/api/wallets/${walletA1._id}`, { token: tokenB });
    assert.strictEqual(getRes.status, 404);

    // User B tries to transfer out of User A's wallet
    const transferRes = await apiRequest('/api/transfers', {
      method: 'POST',
      body: {
        fromWalletId: walletA1._id,
        toWalletId: walletA2._id,
        amount: 50,
      },
      token: tokenB,
    });
    assert.strictEqual(transferRes.status, 404);

    // User B tries to rename User A's wallet
    const patchRes = await apiRequest(`/api/wallets/${walletA1._id}`, {
      method: 'PATCH',
      body: { name: 'Hacked' },
      token: tokenB,
    });
    assert.strictEqual(patchRes.status, 404);
  });

  // Scenario 13: Reject archived wallets for new transactions and transfers
  it('Scenario 13: Should reject transactions and transfers for archived wallets', async () => {
    // Create and archive a temporary wallet
    const wRes = await apiRequest('/api/wallets', {
      method: 'POST',
      body: { name: 'Old Account', openingBalance: 100 },
      token: tokenA,
    });
    const tempWallet = wRes.data.wallet || wRes.data;
    const tempWalletId = tempWallet._id;

    // Archive it
    const archiveRes = await apiRequest(`/api/wallets/${tempWalletId}/archive`, {
      method: 'POST',
      token: tokenA,
    });
    assert.strictEqual(archiveRes.status, 200);
    const archivedWallet = archiveRes.data.wallet || archiveRes.data;
    assert.strictEqual(archivedWallet.isArchived, true);

    // Try creating a transaction against the archived wallet
    const txRes = await apiRequest('/api/transactions', {
      method: 'POST',
      body: {
        description: 'Should fail',
        amount: 25,
        type: 'expense',
        category: 'Food & Dining',
        date: new Date().toISOString(),
        walletId: tempWalletId,
      },
      token: tokenA,
    });
    assert.strictEqual(txRes.status, 400);
    assert.match(txRes.data.message, /archived/i);

    // Try transferring from archived wallet
    const trRes = await apiRequest('/api/transfers', {
      method: 'POST',
      body: {
        fromWalletId: tempWalletId,
        toWalletId: walletA1._id,
        amount: 10,
      },
      token: tokenA,
    });
    assert.strictEqual(trRes.status, 400);
    assert.match(trRes.data.message, /archived/i);
  });

  // Scenario 14: Test insufficient funds according to documented policy
  it('Scenario 14: Overdraft policy should permit transfer with projected balance warning', async () => {
    // walletA2 currently has 1350. Transfer 2000 (exceeds balance).
    const res = await apiRequest('/api/transfers', {
      method: 'POST',
      body: {
        fromWalletId: walletA2._id,
        toWalletId: walletA1._id,
        amount: 2000,
        description: 'Overdraft test transfer',
      },
      token: tokenA,
    });

    assert.strictEqual(res.status, 201, 'Should permit transfer with overdraft per product policy');
    const tr = res.data.transfer || res.data;
    assert.strictEqual(tr.amount, 2000);
    assert.ok(res.data.warning, 'Should include warning note in response');
    assert.ok(res.data.sourceWalletRemainingBalance < 0, 'Remaining balance should reflect negative balance');
  });

  // Scenario 15: Test concurrent transfers and retry behavior (idempotency)
  it('Scenario 15: Idempotency key must prevent duplicate transfers on retried requests', async () => {
    const idempotencyKey = `idemp_${Date.now()}_abc`;

    const res1 = await apiRequest('/api/transfers', {
      method: 'POST',
      body: {
        fromWalletId: walletA1._id,
        toWalletId: walletA2._id,
        amount: 100,
        idempotencyKey,
      },
      token: tokenA,
    });
    assert.strictEqual(res1.status, 201);
    const tr1 = res1.data.transfer || res1.data;
    const transferId1 = tr1._id.toString();

    // Retry identical request with same idempotency key
    const res2 = await apiRequest('/api/transfers', {
      method: 'POST',
      body: {
        fromWalletId: walletA1._id,
        toWalletId: walletA2._id,
        amount: 100,
        idempotencyKey,
      },
      token: tokenA,
    });
    assert.strictEqual(res2.status, 200, 'Retry should return 200 with existing transfer');
    const tr2 = res2.data.transfer || res2.data;
    assert.strictEqual(tr2._id.toString(), transferId1, 'Must return the original transfer record without duplicating');
    assert.strictEqual(res2.data.isDuplicate, true);
  });

  // Scenario 16: Verify transaction edits and deletions update calculations correctly
  it('Scenario 16: Transaction updates and deletions must immediately update wallet balances', async () => {
    // Create new transaction in walletA3 (opening 200)
    const tx = await apiRequest('/api/transactions', {
      method: 'POST',
      body: {
        description: 'Fuel',
        amount: 50,
        type: 'expense',
        category: 'Transportation',
        date: new Date().toISOString(),
        walletId: walletA3._id,
      },
      token: tokenA,
    });
    assert.strictEqual(tx.status, 201);
    const txDoc = tx.data.transaction || tx.data;
    const txId = txDoc._id;

    // Check balance: 200 - 50 = 150
    let wRes = await apiRequest(`/api/wallets/${walletA3._id}`, { token: tokenA });
    assert.strictEqual(wRes.status, 200);
    assert.strictEqual(wRes.data.balance, 150);

    // Edit transaction: change amount to 80
    const editRes = await apiRequest(`/api/transactions/${txId}`, {
      method: 'PUT',
      body: {
        description: 'Fuel Premium',
        amount: 80,
        type: 'expense',
        category: 'Transportation',
        date: new Date().toISOString(),
        walletId: walletA3._id,
      },
      token: tokenA,
    });
    assert.strictEqual(editRes.status, 200);

    // Check balance: 200 - 80 = 120
    wRes = await apiRequest(`/api/wallets/${walletA3._id}`, { token: tokenA });
    assert.strictEqual(wRes.data.balance, 120);

    // Delete transaction
    const delRes = await apiRequest(`/api/transactions/${txId}`, {
      method: 'DELETE',
      token: tokenA,
    });
    assert.strictEqual(delRes.status, 200);

    // Check balance restored: 200
    wRes = await apiRequest(`/api/wallets/${walletA3._id}`, { token: tokenA });
    assert.strictEqual(wRes.data.balance, 200);
  });

  // Scenario 17: Verify budgets, analytics and exports remain correct
  it('Scenario 17: Analytics must correctly isolate wallet scope and exclude transfers', async () => {
    const analyticsAll = await apiRequest('/api/transactions/analytics', { token: tokenA });
    assert.strictEqual(analyticsAll.status, 200);
    assert.ok(analyticsAll.data.periods, 'Analytics all-scope should return period stats');

    // Wallet-scoped analytics
    const analyticsW1 = await apiRequest(`/api/transactions/analytics?walletId=${walletA1._id}`, { token: tokenA });
    assert.strictEqual(analyticsW1.status, 200);
    assert.ok(analyticsW1.data.periods.allTime.income >= 5000);

    // PDF report generation
    const pdfRes = await apiRequest(`/api/transactions/report?walletId=${walletA1._id}`, { token: tokenA });
    assert.strictEqual(pdfRes.status, 200);
    assert.ok(pdfRes.headers.get('content-type').includes('application/pdf'), 'Report should be valid PDF');
  });

  // Scenario 18: Verify existing data migration and idempotency
  it('Scenario 18: Migration script must be idempotent and safe to execute multiple times', async () => {
    // Run migration
    const res1 = await runMigration({ dryRun: false });
    assert.ok(res1.success);

    // Run migration again - should do zero additional modifications
    const res2 = await runMigration({ dryRun: false });
    assert.ok(res2.success);
    assert.strictEqual(res2.transactionsMigrated, 0, 'Subsequent run should find 0 unmigrated transactions');
  });

  // Scenario 19: Verify existing application works without manually creating a wallet
  it('Scenario 19: New transactions without explicit walletId automatically assign to default wallet', async () => {
    // Create transaction without walletId
    const res = await apiRequest('/api/transactions', {
      method: 'POST',
      body: {
        description: 'Auto-wallet fallback transaction',
        amount: 99,
        type: 'expense',
        category: 'Food & Dining',
        date: new Date().toISOString(),
      },
      token: tokenA,
    });

    assert.strictEqual(res.status, 201);
    const tx = res.data.transaction || res.data;
    assert.ok(tx.wallet, 'Transaction must be auto-assigned a wallet');
  });

  // Scenario 20: Safe deletion checks prevent destroying financial history
  it('Scenario 20: Safe deletion checks prevent destroying financial history', async () => {
    // Attempting to delete walletA1 (which has transactions) should be safely rejected
    const delRes = await apiRequest(`/api/wallets/${walletA1._id}`, {
      method: 'DELETE',
      token: tokenA,
    });
    assert.strictEqual(delRes.status, 400);
    assert.match(delRes.data.message, /cannot delete.*wallet/i);
    assert.ok(delRes.data.transactionCount > 0 || delRes.data.transferCount > 0);
    assert.strictEqual(delRes.data.suggestArchive, true);
  });
});
