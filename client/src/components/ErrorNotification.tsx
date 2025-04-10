import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorNotificationProps {
  message: string;
  onClose?: () => void;
  duration?: number;
}

const ErrorNotification = ({ 
  message, 
  onClose,
  duration = 5000
}: ErrorNotificationProps) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };
  
  if (!visible) return null;
  
  return (
    <div className="fixed top-4 right-4 bg-red-500 text-white rounded-lg shadow-lg p-4 flex items-center max-w-md z-50 animate-in fade-in slide-in-from-top-5">
      <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="font-medium mb-1">Chyba</h4>
        <p className="text-sm">{message}</p>
      </div>
      <button 
        onClick={handleClose}
        className="ml-4 text-white hover:text-red-100"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ErrorNotification;
