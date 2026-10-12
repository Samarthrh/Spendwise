import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const CurrencyContext = createContext();

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
};

export const CurrencyProvider = ({ children }) => {
  const { user } = useAuth();
  const currentCurrency = user?.currency || 'USD';
  const symbol = CURRENCY_SYMBOLS[currentCurrency] || '$';

  const formatAmount = (amount) => {
    const val = Number(amount) || 0;
    // Format with commas and 2 decimals
    const formattedNum = Math.abs(val).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${val < 0 ? '-' : ''}${symbol}${formattedNum}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency: currentCurrency, symbol, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
