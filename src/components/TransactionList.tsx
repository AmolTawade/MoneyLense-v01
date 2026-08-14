import React from 'react';
import type { Transaction } from '../types/Transaction';
import { formatCurrency, formatDate, getEntityName } from '../utils/formatters';
import './TransactionList.css';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export const TransactionList: React.FC<Props> = ({ transactions, onDelete }) => {
  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <h3>No transactions yet</h3>
        <p>Add your first transaction to start tracking your money.</p>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      onDelete(id);
    }
  };

  const getAmountClass = (type: string) => {
    switch (type) {
      case 'EXPENSE': return 'amt-expense';
      case 'INCOME': return 'amt-income';
      case 'INVESTMENT': return 'amt-investment';
      case 'TRANSFER': return 'amt-transfer';
      default: return '';
    }
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'EXPENSE': return 'badge-expense';
      case 'INCOME': return 'badge-income';
      case 'INVESTMENT': return 'badge-investment';
      case 'TRANSFER': return 'badge-transfer';
      default: return '';
    }
  };

  const getFormattedAmount = (t: Transaction) => {
    const formatted = formatCurrency(t.amount);
    if (t.type === 'EXPENSE') return `-${formatted}`;
    if (t.type === 'INCOME') return `+${formatted}`;
    return formatted;
  };

  return (
    <div className="transaction-list-container">
      {/* Desktop View */}
      <table className="desktop-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Entity</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t.id}>
              <td>{formatDate(t.date)}</td>
              <td><span className={`badge ${getBadgeClass(t.type)}`}>{t.type}</span></td>
              <td>{t.category}</td>
              <td>
                <div style={{ fontWeight: 500 }}>{getEntityName(t)}</div>
                {t.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.description}</div>}
                {t.type === 'INVESTMENT' && t.metadata && 'units' in t.metadata && t.metadata.units && (
                  <div style={{ fontSize: '12px', color: 'var(--primary-color)' }}>{t.metadata.units} Units</div>
                )}
              </td>
              <td className={getAmountClass(t.type)}>{getFormattedAmount(t)}</td>
              <td>
                <button className="delete-btn" onClick={() => handleDelete(t.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile View */}
      <div className="mobile-cards">
        {transactions.map(t => (
          <div key={t.id} className="transaction-card">
            <div className="card-header">
              <div>
                <div className="card-title">{getEntityName(t)}</div>
                <div className="card-subtitle">{formatDate(t.date)} • {t.category}</div>
              </div>
              <div className={getAmountClass(t.type)} style={{ textAlign: 'right' }}>
                {getFormattedAmount(t)}
              </div>
            </div>
            {t.description && <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{t.description}</div>}
            {t.type === 'INVESTMENT' && t.metadata && 'units' in t.metadata && t.metadata.units && (
              <div style={{ fontSize: '14px', color: 'var(--primary-color)', marginTop: '4px' }}>{t.metadata.units} Units</div>
            )}
            <div className="card-footer">
              <span className={`badge ${getBadgeClass(t.type)}`}>{t.type}</span>
              <button className="delete-btn" onClick={() => handleDelete(t.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
