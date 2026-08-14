import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storageService';
import type { Transaction, TransactionType, TransactionCategory } from '../types/Transaction';
import { TransactionList } from '../components/TransactionList';
import { getEntityName } from '../utils/formatters';
import './TransactionsPage.css';

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Filters state
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<TransactionCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'HIGHEST' | 'LOWEST'>('NEWEST');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = () => {
    setTransactions(storageService.getTransactions());
  };

  const handleDelete = (id: string) => {
    storageService.removeTransaction(id);
    loadTransactions(); // refresh immediately
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // 1. Type Filter
    if (typeFilter !== 'ALL') {
      result = result.filter(t => t.type === typeFilter);
    }

    // 2. Category Filter
    if (categoryFilter !== 'ALL') {
      result = result.filter(t => t.category === categoryFilter);
    }

    // 3. Search Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => {
        const entity = getEntityName(t).toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const cat = t.category.toLowerCase();
        return entity.includes(q) || desc.includes(q) || cat.includes(q);
      });
    }

    // 4. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'NEWEST':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'OLDEST':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'HIGHEST':
          return b.amount - a.amount;
        case 'LOWEST':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return result;
  }, [transactions, typeFilter, categoryFilter, searchQuery, sortBy]);

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1 style={{ margin: 0, fontWeight: 700 }}>Transactions</h1>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Search</label>
          <input 
            type="text" 
            placeholder="Merchant, category, desc..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Type Filter</label>
          <select value={typeFilter} onChange={e => {
            setTypeFilter(e.target.value as any);
            setCategoryFilter('ALL'); // Reset category when type changes
          }}>
            <option value="ALL">All Types</option>
            <option value="EXPENSE">Expenses</option>
            <option value="INCOME">Income</option>
            <option value="INVESTMENT">Investments</option>
            <option value="TRANSFER">Transfers</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="HIGHEST">Highest Amount</option>
            <option value="LOWEST">Lowest Amount</option>
          </select>
        </div>

        {(typeFilter === 'ALL' || typeFilter === 'EXPENSE') && (
          <div className="filter-group">
            <label>Category Filter (Expenses)</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)}>
              <option value="ALL">All Categories</option>
              <option value="FOOD">Food</option>
              <option value="SHOPPING">Shopping</option>
              <option value="GROCERIES">Groceries</option>
              <option value="TRANSPORT">Transport</option>
              <option value="BILLS">Bills</option>
              <option value="ENTERTAINMENT">Entertainment</option>
              <option value="HEALTHCARE">Healthcare</option>
              <option value="PERSONAL">Personal</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        )}
      </div>

      <TransactionList 
        transactions={filteredAndSortedTransactions} 
        onDelete={handleDelete} 
      />
    </div>
  );
};
