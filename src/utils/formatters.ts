import type { Transaction } from '../types/Transaction';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getEntityName = (t: Transaction): string => {
  if (t.type === 'TRANSFER' && t.metadata && 'recipient' in t.metadata && t.metadata.recipient) {
    return t.metadata.recipient;
  }
  if (t.type === 'INVESTMENT' && t.metadata && 'investmentName' in t.metadata && t.metadata.investmentName) {
    return t.metadata.investmentName;
  }
  return t.merchant;
};
