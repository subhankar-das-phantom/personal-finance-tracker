const router = require('express').Router();
let BudgetGoal = require('../models/budgetGoal.model');
const auth = require('../middleware/auth');

// Get all budget goals for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const budgetGoals = await BudgetGoal.find({ user: req.user });
    res.json(budgetGoals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new budget goal
router.post('/', auth, async (req, res) => {
  try {
    const { category, amount, month, year } = req.body;

    // Check if a budget goal for this category, month, and year already exists for the user
    const existingGoal = await BudgetGoal.findOne({
      user: req.user,
      category,
      month,
      year,
    });

    if (existingGoal) {
      return res.status(400).json({ message: 'Budget goal for this category and month already exists.' });
    }

    const newBudgetGoal = new BudgetGoal({
      user: req.user,
      category,
      amount,
      month,
      year,
    });

    const savedBudgetGoal = await newBudgetGoal.save();
    res.json(savedBudgetGoal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an existing budget goal
router.put('/:id', auth, async (req, res) => {
  try {
    const { category, amount, month, year } = req.body;

    const updatedBudgetGoal = await BudgetGoal.findOneAndUpdate(
      { _id: req.params.id, user: req.user }, // Ensure user owns the goal
      { category, amount, month, year },
      { new: true, runValidators: true }
    );

    if (!updatedBudgetGoal) {
      return res.status(404).json({ message: 'Budget goal not found or unauthorized.' });
    }

    res.json(updatedBudgetGoal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a budget goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedBudgetGoal = await BudgetGoal.findOneAndDelete({ _id: req.params.id, user: req.user });

    if (!deletedBudgetGoal) {
      return res.status(404).json({ message: 'Budget goal not found or unauthorized.' });
    }

    res.json({ message: 'Budget goal deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get budget progress for current month
router.get('/progress', auth, async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get all budget goals for current month
    const budgetGoals = await BudgetGoal.find({ 
      user: req.user,
      month: currentMonth,
      year: currentYear
    });
    
    // Get actual spending for current month
    const Transaction = require('../models/transaction.model');
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    const actualSpending = await Transaction.aggregate([
      {
        $match: {
          user: req.user,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);
    
    // Combine budget goals with actual spending
    const budgetProgress = budgetGoals.map(goal => {
      const actual = actualSpending.find(spending => spending._id === goal.category) || 
                    { totalSpent: 0, transactionCount: 0 };
      
      const spent = actual.totalSpent;
      const remaining = goal.amount - spent;
      const percentageUsed = goal.amount > 0 ? (spent / goal.amount) * 100 : 0;
      
      return {
        _id: goal._id,
        category: goal.category,
        budgetAmount: goal.amount,
        actualSpent: spent,
        remaining: remaining,
        percentageUsed: percentageUsed,
        transactionCount: actual.transactionCount,
        status: percentageUsed > 100 ? 'over' : percentageUsed > 80 ? 'warning' : 'good',
        month: goal.month,
        year: goal.year
      };
    });
    
    // Also include categories with spending but no budget
    const categoriesWithoutBudget = actualSpending.filter(spending => 
      !budgetGoals.find(goal => goal.category === spending._id)
    ).map(spending => ({
      category: spending._id,
      budgetAmount: 0,
      actualSpent: spending.totalSpent,
      remaining: -spending.totalSpent,
      percentageUsed: 100,
      transactionCount: spending.transactionCount,
      status: 'no-budget',
      month: currentMonth,
      year: currentYear,
      hasBudget: false
    }));
    
    const totalBudget = budgetGoals.reduce((sum, goal) => sum + goal.amount, 0);
    const totalSpent = actualSpending.reduce((sum, spending) => sum + spending.totalSpent, 0);
    
    res.json({
      budgetProgress: [...budgetProgress, ...categoriesWithoutBudget],
      summary: {
        totalBudget,
        totalSpent,
        totalRemaining: totalBudget - totalSpent,
        overallPercentageUsed: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        categoriesCount: budgetGoals.length,
        categoriesWithoutBudgetCount: categoriesWithoutBudget.length
      },
      month: currentMonth,
      year: currentYear
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get budget summary for specific month/year
router.get('/summary/:year/:month', auth, async (req, res) => {
  try {
    const { year, month } = req.params;
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    const budgetGoals = await BudgetGoal.find({ 
      user: req.user,
      month: monthNum,
      year: yearNum
    });
    
    const Transaction = require('../models/transaction.model');
    const startOfMonth = new Date(yearNum, monthNum, 1);
    const endOfMonth = new Date(yearNum, monthNum + 1, 0, 23, 59, 59, 999);
    
    const actualSpending = await Transaction.aggregate([
      {
        $match: {
          user: req.user,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' }
        }
      }
    ]);
    
    const summary = {
      totalBudget: budgetGoals.reduce((sum, goal) => sum + goal.amount, 0),
      totalSpent: actualSpending.reduce((sum, spending) => sum + spending.totalSpent, 0),
      goalsCount: budgetGoals.length,
      month: monthNum,
      year: yearNum,
      monthName: new Date(yearNum, monthNum).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
    
    res.json(summary);
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available categories (from existing transactions)
router.get('/categories', auth, async (req, res) => {
  try {
    const Transaction = require('../models/transaction.model');
    
    const categories = await Transaction.aggregate([
      { $match: { user: req.user, type: 'expense' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { category: '$_id', transactionCount: '$count', _id: 0 } }
    ]);
    
    res.json(categories);
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
