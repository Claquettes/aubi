import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import styles from './Text.module.css';

type Size = '2xs' | 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
type Weight = 'regular' | 'medium' | 'bold';
type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent';

const sizeMap: Record<Size, string> = {
  '2xs': styles.t2xs,
  xs: styles.xs,
  sm: styles.sm,
  base: styles.base,
  lg: styles.lg,
  xl: styles.xl,
  '2xl': styles.t2xl,
  '3xl': styles.t3xl,
};

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  size?: Size;
  weight?: Weight;
  color?: Tone;
  uppercase?: boolean;
  truncate?: boolean;
  display?: boolean;
  children?: ReactNode;
}

export function Text({
  as: Tag = 'span' as ElementType,
  size = 'base',
  weight = 'regular',
  color = 'primary',
  uppercase,
  truncate,
  display,
  className = '',
  children,
  ...rest
}: TextProps) {
  const cls = [
    sizeMap[size],
    styles[weight],
    styles[color],
    uppercase ? styles.uppercase : '',
    truncate ? styles.truncate : '',
    display ? styles.display : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
