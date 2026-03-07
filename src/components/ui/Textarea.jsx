import styles from './Textarea.module.css';

const Textarea = ({ className = '', ...props }) => {
  return (
    <textarea className={`${styles.textarea} ${className}`} {...props} />
  );
};

export default Textarea;
