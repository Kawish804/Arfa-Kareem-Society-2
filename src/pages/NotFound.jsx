import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button.jsx';
import styles from './NotFound.module.css';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <h1 className={styles.code}>404</h1>
      <p className={styles.message}>Page not found</p>
      <Button onClick={() => navigate('/')}>Go Home</Button>
    </div>
  );
};

export default NotFound;
