import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ai_review_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ai_review_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data?.user) {
          const fetchedUser = {
            id: res.data.user._id,
            name: res.data.user.fullName,
            email: res.data.user.email,
            role: res.data.user.role || (res.data.user.internId ? 'intern' : 'admin'),
            internId: res.data.user.internId,
            status: res.data.user.status,
            currentTaskId: res.data.user.currentTaskId,
          };
          setUser(fetchedUser);
          localStorage.setItem('ai_review_user', JSON.stringify(fetchedUser));
        }
      } catch (err) {
        console.warn('[AuthContext] Verification failed:', err.message);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [token]);

  const login = async (email, password, role = 'admin') => {
    const response = await api.post('/auth/login', { email, password, role });
    if (response.data.success) {
      const { token: receivedToken, user: receivedUser } = response.data;
      localStorage.setItem('ai_review_token', receivedToken);
      localStorage.setItem('ai_review_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    }
    return { success: false, message: response.data.message };
  };

  const logout = () => {
    localStorage.removeItem('ai_review_token');
    localStorage.removeItem('ai_review_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
        isIntern: user?.role === 'intern',
        isLoading,
        login,
        logout,
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
