/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('[AuthContext] Session expired:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const saveAuth = (authData) => {
    if (authData.token) {
      setToken(authData.token);
      localStorage.setItem('token', authData.token);
    }
    if (authData.user) {
      setUser(authData.user);
      localStorage.setItem('user', JSON.stringify(authData.user));
    }
  };

  const login = async (mobile, password, role) => {
    const res = await authService.login(mobile, password, role);
    saveAuth(res);
    return res.user;
  };

  const driverSignup = async (data) => {
    const res = await authService.driverSignup(data);
    saveAuth(res);
    return res.user;
  };

  const passengerSignup = async (data) => {
    const res = await authService.passengerSignup(data);
    saveAuth(res);
    return res.user;
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        role: user?.role || null,
        login,
        driverSignup,
        passengerSignup,
        logout,
        isAuthenticated: Boolean(user && token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
