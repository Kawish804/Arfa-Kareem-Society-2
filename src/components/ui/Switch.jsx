import styles from './Switch.module.css';

const Switch = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`${styles.switch} ${checked ? styles.checked : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.thumb} />
    </button>
  );
};

export default Switch;
