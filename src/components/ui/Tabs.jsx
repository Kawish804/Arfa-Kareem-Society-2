import { useState } from 'react';
import styles from './Tabs.module.css';

const Tabs = ({ tabs, defaultTab, children }) => {
  const [active, setActive] = useState(defaultTab || tabs[0]?.value);

  return (
    <div>
      <div className={styles.list}>
        {tabs.map(tab => (
          <button
            key={tab.value}
            className={`${styles.trigger} ${active === tab.value ? styles.active : ''}`}
            onClick={() => setActive(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.content}>
        {typeof children === 'function' ? children(active) : children}
      </div>
    </div>
  );
};

export default Tabs;
