import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm",
    success: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm",
    warning: "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm",
    info: "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm",
    neutral: "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};