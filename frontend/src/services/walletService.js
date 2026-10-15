import api from './api';

const walletService = {
  getWallets: (params = {}) => {
    return api.get('wallets', { params });
  },

  getWallet: (id) => {
    return api.get(`wallets/${id}`);
  },

  createWallet: (data) => {
    return api.post('wallets', data);
  },

  updateWallet: (id, data) => {
    return api.put(`wallets/${id}`, data);
  },

  archiveWallet: (id) => {
    return api.post(`wallets/${id}/archive`);
  },

  unarchiveWallet: (id) => {
    return api.post(`wallets/${id}/unarchive`);
  },

  deleteWallet: (id) => {
    return api.delete(`wallets/${id}`);
  },
};

export default walletService;
