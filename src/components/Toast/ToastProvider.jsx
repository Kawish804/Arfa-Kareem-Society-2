import { createContext, useContext, useState, useCallback } from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, description, variant }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className={styles.container}>
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${styles.toast} ${t.variant === 'destructive' ? styles.destructive : ''}`}
            onClick={() => removeToast(t.id)}
          >
            {t.title && <p className={styles.title}>{t.title}</p>}
            {t.description && <p className={styles.description}>{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
