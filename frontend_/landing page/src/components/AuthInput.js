import React, { forwardRef } from 'react';

const AuthInput = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = `
    w-full px-4 py-3 border rounded-lg transition-colors duration-200 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
  `;
  
  const errorClasses = error 
    ? 'border-red-500 focus:ring-red-500' 
    : 'border-gray-300 hover:border-gray-400';

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        className={`${baseClasses} ${errorClasses} ${className}`}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

AuthInput.displayName = 'AuthInput';

export default AuthInput;
