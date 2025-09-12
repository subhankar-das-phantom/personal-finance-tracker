
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      // Fetch user data
      axios.get('http://localhost:5000/api/users/me')
        .then(res => setUser(res.data))
        .catch(err => {
          console.error(err);
          setToken(null);
          localStorage.removeItem('token');
        });
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      setUser(null);
    }
  }, [token]);

  const register = async (username, email, password) => {
    return axios.post('http://localhost:5000/api/users/register', { username, email, password });
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/users/login', { email, password });
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
