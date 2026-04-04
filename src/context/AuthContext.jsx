import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // When the app loads, check if the user is already logged in for this specific tab
  useEffect(() => {
    // --- 🔴 KILL THE GHOSTS 🔴 ---
    // Aggressively clear old localStorage from previous tests so tabs don't bleed!
    localStorage.removeItem('society_user');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    // -----------------------------

    // Strictly use sessionStorage so each tab's login is 100% independent
    const savedUser = sessionStorage.getItem('society_user');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    // Save session strictly to this tab
    sessionStorage.setItem('society_user', JSON.stringify(userData)); 
  };

  const logout = () => {
    setUser(null);
    // Clear everything for this tab when logging out
    sessionStorage.removeItem('society_user'); 
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userRole');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {/* We wait until loading is false before rendering children so protected routes don't flash */}
      {!loading && children} 
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);