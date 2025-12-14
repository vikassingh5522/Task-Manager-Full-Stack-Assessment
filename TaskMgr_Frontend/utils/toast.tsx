import React from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const defaultStyle = {
  background: '#ffffff',
  color: '#1f2937', // gray-800
  padding: '12px 16px',
  borderRadius: '8px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  border: '1px solid #f3f4f6', // gray-100
  fontSize: '14px',
  fontWeight: 500,
};

export const showSuccess = (message: string) => {
  toast.success(message, {
    icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    style: defaultStyle,
    duration: 3000,
  });
};

export const showError = (message: string) => {
  toast.error(message, {
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
    style: defaultStyle,
    duration: 4000,
  });
};

export const showInfo = (message: string) => {
  toast(message, {
    icon: <Info className="w-5 h-5 text-blue-500" />,
    style: defaultStyle,
    duration: 3000,
  });
};

export const showWarning = (message: string) => {
  toast(message, {
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    style: defaultStyle,
    duration: 4000,
  });
};