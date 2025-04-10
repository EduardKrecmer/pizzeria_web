import React from 'react';

interface FormFieldProps {
  label: string;
  id: string;
  name: string;
  value: string;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  error?: string;
  placeholder?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  id, 
  name, 
  value, 
  type = 'text', 
  onChange, 
  icon, 
  error, 
  placeholder = '' 
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-primary transition-colors">
        {icon}
      </div>
      <input 
        type={type} 
        id={id} 
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full pl-10 px-4 py-3 border ${
          error ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-300'
        } rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all duration-200`}
        style={{ caretColor: '#4a5d23' }}
      />
    </div>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default FormField;