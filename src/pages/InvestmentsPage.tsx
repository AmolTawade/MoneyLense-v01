import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { analyticsService } from '../services/analyticsService';
import type { Transaction } from '../types/Transaction';
import { formatCurrency } from '../utils/formatters';
import { TransactionList } from '../components/TransactionList';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import './InvestmentsPage.css';
import '../pages/FoodPage.css'; // Reuse time-filter, insight-card, section-divider styles
import '../pages/DashboardPage.css'; // Reuse kpi-grid and chart-grid styles

const COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#f97316'];

const KPICard = ({ title, value, isCurrency = false, subtitle = '' }: { title: string, value: number, isCurrency?: boolean, subtitle?: string }) => {
  return (
    <div className="kpi-card">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{isCurrency ? formatCurrency(value) : value.toLocaleString()}</div>
      {subtitle && <div className="kpi-change neutral">{subtitle}</div>}
    </div>
  );
};

export const InvestmentsPage: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<string>('THIS_MONTH');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAllTransactions(storageService.getTransactions());
  };

  const handleDelete = (id: string) => {
    storageService.removeTransaction(id);
    loadData();
  };

  // Filter Data
  const periodTransactions = useMemo(() => {
    return analyticsService.filterByDateRangeStrict(allTransactions, period);
  }, [allTransactions, period]);

  const investmentTransactions = useMemo(() => {
    return analyticsService.getInvestmentTransactions(periodTransactions);
  }, [periodTransactions]);

  // Financial Analytics
  const totalInvested = investmentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalOrders = investmentTransactions.length;
  const avgOrderValue = totalOrders > 0 ? totalInvested / totalOrders : 0;

  // MoM Comparison (Calculated from allTransactions directly, not periodTransactions)
  const currentMonthInvestments = analyticsService.getCurrentMonthTotal(allTransactions, 'INVESTMENT');
  const previousMonthInvestments = analyticsService.getPreviousMonthTotal(allTransactions, 'INVESTMENT');
  const momInsight = analyticsService.getInvestmentMoMInsight(currentMonthInvestments, previousMonthInvestments);

  const typeData = analyticsService.getInvestmentSpendingByDimension(investmentTransactions, 'investmentType');
  const nameData = analyticsService.getInvestmentSpendingByDimension(investmentTransactions, 'investmentName').slice(0, 5); // top 5
  
  const typeInsight = analyticsService.getInvestmentTypeInsight(investmentTransactions);
  const topInvestmentInsight = analyticsService.getTopInvestmentInsight(investmentTransactions);

  const trendData = analyticsService.getMonthlyInvestmentSeries(investmentTransactions);

  return (
    <div className="investments-page">
      <div className="investments-header">
        <h1 style={{ margin: 0, fontWeight: 700 }}>Investments</h1>
        <select className="time-filter" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="THIS_MONTH">This Month</option>
          <option value="LAST_MONTH">Last Month</option>
          <option value="LAST_3_MONTHS">Last 3 Months</option>
          <option value="LAST_6_MONTHS">Last 6 Months</option>
          <option value="LAST_12_MONTHS">Last 12 Months</option>
          <option value="ALL_TIME">All Time</option>
        </select>
      </div>

      {investmentTransactions.length === 0 ? (
        <div className="empty-investments">No investments recorded for this period.</div>
      ) : (
        <>
          {/* Insights */}
          {momInsight && period === 'THIS_MONTH' && (
            <div className="insight-card">
              <span style={{ fontSize: '20px' }}>📈</span>
              <span className="insight-text">{momInsight}</span>
            </div>
          )}
          {typeInsight && (
            <div className="insight-card">
              <span style={{ fontSize: '20px' }}>💡</span>
              <span className="insight-text">{typeInsight}</span>
            </div>
          )}
          {topInvestmentInsight && (
            <div className="insight-card">
              <span style={{ fontSize: '20px' }}>🏆</span>
              <span className="insight-text">Your highest investment is in {topInvestmentInsight.name} — {formatCurrency(topInvestmentInsight.amount)}.</span>
            </div>
          )}

          {/* KPIs */}
          <div className="kpi-grid">
            <KPICard title="Total Invested" value={totalInvested} isCurrency={true} />
            <KPICard title="This Month" value={currentMonthInvestments} isCurrency={true} subtitle="Total overall" />
            <KPICard title="Number of Investments" value={totalOrders} />
            <KPICard title="Average Investment" value={avgOrderValue} isCurrency={true} />
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-title">Investment Type Distribution</div>
              <div style={{ width: '100%', height: 300 }}>
                {typeData.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {typeData.map((_, index) => (
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
                    No data available.
                  </div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title">Top Investments</div>
              <div style={{ width: '100%', height: 300 }}>
                {nameData.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={nameData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="var(--text-muted)" tickFormatter={(value) => `₹${value/1000}k`} />
                      <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={120} />
                      <Tooltip 
                        formatter={(value: any) => formatCurrency(Number(value))}
                        contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }}
                      />
                      <Bar dataKey="value" name="Amount" fill="var(--primary-color)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No data available.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="chart-card">
              <div className="chart-title">Monthly Investment Trend</div>
              <div style={{ width: '100%', height: 300 }}>
                {trendData.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                      <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} tickFormatter={(value) => `₹${value/1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: any) => formatCurrency(Number(value))}
                      />
                      <Bar dataKey="amount" name="Invested" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No data available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Investments */}
          <div className="section-divider">Recent Investments</div>
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <TransactionList 
              transactions={[...investmentTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)} 
              onDelete={handleDelete} 
            />
          </div>
        </>
      )}
    </div>
  );
};
