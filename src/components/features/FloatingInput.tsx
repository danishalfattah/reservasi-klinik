'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}

function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-sm"
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );
}

function resolveInputType(type: string, showPassword: boolean): string {
  if (type !== 'password') return type;
  return showPassword ? 'text' : 'password';
}

export function FloatingInput({ id, label, type = 'text', required = false, value, onChange }: FloatingInputProps): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = resolveInputType(type, showPassword);
  const isFloated = value.length > 0;

  return (
    <div className="relative">
      <input
        id={id}
        type={inputType}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        className="peer w-full px-3 pt-5 pb-1.5 bg-background border border-border rounded-sm text-[14px] text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder-transparent"
      />
      <label
        htmlFor={id}
        className={`absolute left-3 transition-all duration-150 font-normal cursor-text pointer-events-none text-muted-foreground
          ${isFloated ? 'top-1.5 text-[10px] text-primary' : 'top-3.5 text-[13px]'}
          peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-primary`}
      >
        {label}
      </label>
      {type === 'password' && (
        <PasswordToggle show={showPassword} onToggle={() => setShowPassword((p) => !p)} />
      )}
    </div>
  );
}
