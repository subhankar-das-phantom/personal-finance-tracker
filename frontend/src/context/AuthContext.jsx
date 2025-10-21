
import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      authService.getUser()
        .then(res => setUser(res.data))
        .catch(err => {
          console.error(err);
          setToken(null);
          localStorage.removeItem('token');
        });
    } else {
      setUser(null);
    }
  }, [token]);

  const register = async (username, email, password) => {
    return authService.register(username, email, password);
  };

  const login = async (email, password) => {
    try {
      const res = await authService.login(email, password);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err.response ? err.response.data : err.message);
      return { success: false, error: err.response ? err.response.data.msg : err.message };
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
