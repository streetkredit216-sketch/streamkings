'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import ErrorModal from '@/components/ui/ErrorModal';

interface ErrorContextType {
  showError: (message: string, title?: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('ERROR');

  const showError = (message: string, title: string = 'ERROR') => {
    setErrorMessage(message);
    setErrorTitle(title);
    setIsOpen(true);
  };

  const closeError = () => {
    setIsOpen(false);
  };

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      <ErrorModal
        isOpen={isOpen}
        onClose={closeError}
        message={errorMessage}
        title={errorTitle}
      />
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

