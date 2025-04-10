import React from 'react';
import { Link } from 'react-router-dom';

interface ErrorPageProps {
  message: string;
  error?: Error;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ message, error }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Ups! Nastala chyba</h1>
        <p className="text-lg text-gray-700 mb-6">{message}</p>
        
        {error && (
          <div className="bg-red-100 p-4 rounded-lg mb-6 text-left">
            <p className="font-medium text-red-800 mb-2">Technický detail chyby:</p>
            <p className="text-sm font-mono text-red-700 break-words">{error.message}</p>
          </div>
        )}

        <div className="mt-8">
          <Link 
            to="/"
            className="px-6 py-3 bg-olive-600 hover:bg-olive-700 text-white rounded-full font-medium shadow-md transition-colors"
          >
            Späť na domovskú stránku
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;