import api from './api';

const transferService = {
  getTransfers: (params = {}) => {
    return api.get('transfers', { params });
  },

  getTransfer: (id) => {
    return api.get(`transfers/${id}`);
  },

  createTransfer: (data) => {
    return api.post('transfers', data);
  },

  deleteTransfer: (id) => {
    return api.delete(`transfers/${id}`);
  },
};

export default transferService;
