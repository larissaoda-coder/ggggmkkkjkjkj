import type { InputHTMLAttributes } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValue: (v: number) => void;
  label: string;
}

/** Controle deslizante com preenchimento proporcional ao valor. */
export function Range({ value, min = 0, max = 1, step = 0.01, onValue, label, style, ...rest }: Props) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      onChange={(e) => onValue(Number(e.target.value))}
      style={{ ['--fill' as string]: `${pct}%`, ...style }}
      {...rest}
    />
  );
}
