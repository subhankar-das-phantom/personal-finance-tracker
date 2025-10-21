import api from './api';

const budgetService = {
  getBudgetCategories: () => {
    return api.get('/budget/categories');
  },

  createBudget: (data) => {
    return api.post('/budget', data);
  },

  updateBudget: (id, data) => {
    return api.put(`/budget/${id}`, data);
  },
};

export default budgetService;
