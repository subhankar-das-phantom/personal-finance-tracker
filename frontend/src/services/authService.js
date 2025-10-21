import api from './api';

const authService = {
  getUser: () => {
    return api.get('/users/me');
  },

  register: (username, email, password) => {
    return api.post('/users/register', { username, email, password });
  },

  login: (email, password) => {
    return api.post('/users/login', { email, password });
  },
};

export default authService;
