import styles from './StatCard.module.css';

const StatCard = ({ title, value, icon: Icon, description }) => {
  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div>
          <p className={styles.title}>{title}</p>
          <p className={styles.value}>{value}</p>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        <div className={styles.iconWrap}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
