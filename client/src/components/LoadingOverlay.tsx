import React from 'react';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Načítavam...' }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-gradient-to-br from-olive-50 to-amber-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-olive-600 border-t-olive-700 mb-5"></div>
        <p className="text-olive-800 font-medium text-xl">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;