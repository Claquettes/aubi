import type { LucideIcon } from 'lucide-react';

export interface IconProps {
  icon: LucideIcon;
  size?: 16 | 20 | 24;
  color?: string;
  className?: string;
}

const map = { 16: 16, 20: 20, 24: 24 } as const;

export function Icon({
  icon: Cmp,
  size = 20,
  color = 'currentColor',
  className,
}: IconProps) {
  return <Cmp size={map[size]} color={color} className={className} />;
}
