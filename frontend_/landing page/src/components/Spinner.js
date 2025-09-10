import React from 'react';

const Spinner = ({ 
  size = 'medium', 
  color = 'blue', 
  className = '',
  text = null
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    red: 'border-red-600',
    green: 'border-green-600',
    yellow: 'border-yellow-600',
    purple: 'border-purple-600',
    white: 'border-white',
    gray: 'border-gray-600'
  };

  const spinnerClasses = `
    ${sizeClasses[size]} 
    border-2 border-t-transparent 
    ${colorClasses[color]} 
    rounded-full 
    animate-spin
    ${className}
  `;

  if (text) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className={spinnerClasses}></div>
        <p className="text-sm text-gray-600">{text}</p>
      </div>
    );
  }

  return <div className={spinnerClasses}></div>;
};

// Full page loading spinner
export const PageSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
      <div className="text-center">
        <Spinner size="large" color="blue" />
        <p className="mt-4 text-gray-600 text-lg">{text}</p>
      </div>
    </div>
  );
};

// Inline loading spinner
export const InlineSpinner = ({ text, size = 'small' }) => {
  return (
    <div className="flex items-center space-x-2">
      <Spinner size={size} color="blue" />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
};

// Button loading spinner
export const ButtonSpinner = ({ size = 'small' }) => {
  return <Spinner size={size} color="white" />;
};

export default Spinner;
