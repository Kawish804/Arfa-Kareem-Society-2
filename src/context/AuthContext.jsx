import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Example: { name: 'Ali', role: 'Admin' }
  const [loading, setLoading] = useState(true);

  // When the app loads, check if the user is already logged in (saved in Local Storage)
  useEffect(() => {
    const savedUser = localStorage.getItem('society_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('society_user', JSON.stringify(userData)); // Save session
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('society_user'); // Clear session
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);