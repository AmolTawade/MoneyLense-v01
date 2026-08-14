import React from 'react';
import { AddTransactionForm } from '../components/AddTransactionForm';

export const AddTransactionPage: React.FC = () => {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '8px', fontWeight: 700 }}>Add Transaction</h1>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
        Record your expenses, income, investments, and transfers.
      </p>
      <AddTransactionForm />
    </div>
  );
};
