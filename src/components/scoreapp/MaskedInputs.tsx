import { InputHTMLAttributes, useEffect, useState } from "react";
import {
  formatCurrency,
  formatInteger,
  maskCurrencyWhileTyping,
  parseCurrencyInput,
  parseInteger,
} from "@/lib/scoreapp/masks";

type BaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">;

type CurrencyProps = BaseProps & {
  value: number;
  onChange: (value: number) => void;
};

export function CurrencyInput({ value, onChange, className = "", ...rest }: CurrencyProps) {
  const [text, setText] = useState(formatCurrency(value));
  useEffect(() => { setText(formatCurrency(value)); }, [value]);
  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const masked = maskCurrencyWhileTyping(e.target.value);
        setText(masked);
        onChange(parseCurrencyInput(masked));
      }}
      className={className}
    />
  );
}

type IntegerProps = BaseProps & {
  value: number;
  onChange: (value: number) => void;
};

export function IntegerInput({ value, onChange, className = "", ...rest }: IntegerProps) {
  const [text, setText] = useState(formatInteger(value));
  useEffect(() => { setText(formatInteger(value)); }, [value]);
  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        const parsed = parseInteger(e.target.value);
        setText(formatInteger(parsed));
        onChange(parsed);
      }}
      className={className}
    />
  );
}
