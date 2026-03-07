import Button from '@/components/ui/Button.jsx';
import { Plus } from 'lucide-react';
import styles from './PageHeader.module.css';

const PageHeader = ({ title, description, actionLabel, actionIcon: ActionIcon = Plus, onAction }) => {
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actionLabel && (
        <Button onClick={onAction}>
          <ActionIcon size={16} />
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default PageHeader;
