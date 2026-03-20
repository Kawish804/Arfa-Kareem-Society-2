// src/context/SettingsContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';

// 1. Create the Context
const SettingsContext = createContext();

// 2. Create the Provider Component
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    societyName: 'Arfa Kareem Society',
    university: 'University Campus, Lahore',
    email: 'info@arfakareem.edu',
    phone: '+92-300-1234567',
    notifications: { email: true, events: true, funds: false, announcements: true }
  });
  const [loading, setLoading] = useState(true);

  // Fetch from backend ONLY ONCE when the app starts
  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/settings');
      const data = await res.json();
      if (data && !data.error) {
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to load global settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

// 3. Custom Hook to make using this super easy!
export const useSettings = () => useContext(SettingsContext);