import styles from './ChartCard.module.css';

const ChartCard = ({ title, children }) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.content}>{children}</div>
    </div>
  );
};

export default ChartCard;
