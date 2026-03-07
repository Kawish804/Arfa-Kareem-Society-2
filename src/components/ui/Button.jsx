import styles from './Button.module.css';

const Button = ({ children, variant = 'primary', size = 'default', className = '', onClick, type = 'button', disabled, ...props }) => {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export default Button;
