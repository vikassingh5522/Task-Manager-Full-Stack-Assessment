import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  variant = 'text', 
  width, 
  height, 
  className = '' 
}) => {
  const baseStyles = "animate-pulse bg-gray-200 rounded";
  
  const variants = {
    text: "h-4 w-full",
    circular: "rounded-full",
    rectangular: "h-24 w-full",
  };

  const style = {
    width,
    height,
  };

  return (
    <div 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      style={style}
      role="status"
      aria-label="Loading..."
    />
  );
};