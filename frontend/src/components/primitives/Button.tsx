import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'ghost' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children?: ReactNode;
}

export function Button({
  variant = 'ghost',
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const v =
    variant === 'primary'
      ? styles.primary
      : variant === 'icon'
        ? styles.icon
        : styles.ghost;
  return (
    <button type={type} className={`${styles.btn} ${v} ${className}`} {...rest}>
      {children}
    </button>
  );
}
