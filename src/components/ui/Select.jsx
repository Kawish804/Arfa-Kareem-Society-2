import styles from './Select.module.css';

const Select = ({ children, value, onChange, className = '', ...props }) => {
  return (
    <select
      className={`${styles.select} ${className}`}
      value={value}
      onChange={onChange}
      {...props}
    >
      {children}
    </select>
  );
};

export default Select;
