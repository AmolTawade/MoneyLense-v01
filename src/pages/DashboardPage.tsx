import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { analyticsService } from '../services/analyticsService';
import type { Transaction } from '../types/Transaction';
import { formatCurrency } from '../utils/formatters';
import { TransactionList } from '../components/TransactionList';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { demoTransactions } from '../data/demoData';
import './DashboardPage.css';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const KPICard = ({ title, value, previousValue }: { title: string, value: number, previousValue: number }) => {
  const change = analyticsService.calculatePercentageChange(value, previousValue);
  let changeClass = 'neutral';
  let changeText = 'No change';
  
  if (change !== null) {
    if (change > 0) {
      changeClass = title.toLowerCase().includes('spent') ? 'negative' : 'positive';
      changeText = `↑ ${change.toFixed(1)}%`;
    } else if (change < 0) {
      changeClass = title.toLowerCase().includes('spent') ? 'positive' : 'negative';
      changeText = `↓ ${Math.abs(change).toFixed(1)}%`;
    }
  }

  return (
    <div className="kpi-card">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{formatCurrency(value)}</div>
      <div className={`kpi-change ${changeClass}`}>
        {changeText} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs last month</span>
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTransactions(storageService.getTransactions());
  };

  const handleDelete = (id: string) => {
    storageService.removeTransaction(id);
    loadData();
  };

  // KPIs
  const currentSpent = analyticsService.getCurrentMonthTotal(transactions, 'EXPENSE');
  const prevSpent = analyticsService.getPreviousMonthTotal(transactions, 'EXPENSE');
  
  const currentIncome = analyticsService.getCurrentMonthTotal(transactions, 'INCOME');
  const prevIncome = analyticsService.getPreviousMonthTotal(transactions, 'INCOME');
  
  const currentInvestments = analyticsService.getCurrentMonthTotal(transactions, 'INVESTMENT');
  const prevInvestments = analyticsService.getPreviousMonthTotal(transactions, 'INVESTMENT');
  
  const netCashFlow = currentIncome - currentSpent;
  const prevNetCashFlow = prevIncome - prevSpent;

  // Chart Data
  const categoryData = analyticsService.getSpendingByCategory(transactions);
  const incomeVsExpenseData = analyticsService.getMonthlyIncomeVsExpenseSeries(transactions);

  const handleLoadDemoData = () => {
    if (window.confirm("Load sample transactions? This will replace your current local demo data.")) {
      storageService.saveTransactions(demoTransactions);
      loadData();
      window.location.reload();
    }
  };

  return (
    <div className="dashboard-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontWeight: 700 }}>Overview</h1>
        <button 
          onClick={handleLoadDemoData}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border-color)', 
            color: 'var(--text-color)', 
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Load Demo Data
        </button>
      </div>

      <div className="kpi-grid">
        <KPICard title="Total Spent (This Month)" value={currentSpent} previousValue={prevSpent} />
        <KPICard title="Total Income (This Month)" value={currentIncome} previousValue={prevIncome} />
        <KPICard title="Investments (This Month)" value={currentInvestments} previousValue={prevInvestments} />
        <KPICard title="Net Cash Flow (This Month)" value={netCashFlow} previousValue={prevNetCashFlow} />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Income vs Expense</div>
          <div style={{ width: '100%', height: 300 }}>
            {incomeVsExpenseData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={incomeVsExpenseData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                  <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} tickFormatter={(value) => `₹${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="var(--error-color)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No data for chart.
              </div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Spending by Category</div>
          <div style={{ width: '100%', height: 300 }}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No expense data available.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="recent-transactions-section">
        <div className="chart-title" style={{ marginBottom: '16px' }}>Recent Transactions</div>
        {/* We reuse TransactionList but just slice the top 5 newest */}
        <TransactionList 
          transactions={[...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)} 
          onDelete={handleDelete} 
        />
      </div>
    </div>
  );
};
