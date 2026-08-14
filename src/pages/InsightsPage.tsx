import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { analyticsService } from '../services/analyticsService';
import { insightService } from '../services/insightService';
import type { Transaction } from '../types/Transaction';
import './InsightsPage.css';

export const InsightsPage: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<string>('THIS_MONTH');

  useEffect(() => {
    setAllTransactions(storageService.getTransactions());
  }, []);

  const periodTransactions = useMemo(() => {
    return analyticsService.filterByDateRangeStrict(allTransactions, period);
  }, [allTransactions, period]);

  const insights = useMemo(() => {
    return insightService.generateInsights(allTransactions, periodTransactions, period);
  }, [allTransactions, periodTransactions, period]);

  return (
    <div className="insights-page">
      <div className="insights-header">
        <div>
          <h1 className="insights-title">Your Money Insights</h1>
          <p className="insights-subtitle">Highlights from your recent financial activity.</p>
        </div>
        <select className="time-filter" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="THIS_MONTH">This Month</option>
          <option value="LAST_MONTH">Last Month</option>
          <option value="LAST_3_MONTHS">Last 3 Months</option>
          <option value="LAST_6_MONTHS">Last 6 Months</option>
          <option value="LAST_12_MONTHS">Last 12 Months</option>
          <option value="ALL_TIME">All Time</option>
        </select>
      </div>

      {insights.length === 0 ? (
        <div className="empty-insights">
          <h3>Not enough data yet</h3>
          <p>Add a few more transactions and MoneyLens will start identifying patterns.</p>
        </div>
      ) : (
        <div className="insights-grid">
          {insights.map(insight => (
            <div key={insight.id} className={`insight-card ${insight.tone}`}>
              {insight.icon && <div className="insight-icon">{insight.icon}</div>}
              <div className="insight-content">
                <div className="insight-title" style={{
                  color: insight.tone === 'WARNING' ? 'var(--error-color)' : 
                         insight.tone === 'POSITIVE' ? 'var(--success-color)' : 
                         insight.tone === 'INFO' ? 'var(--primary-color)' : 'var(--text-muted)'
                }}>
                  {insight.title}
                </div>
                <p className="insight-message">{insight.message}</p>
              </div>
              {insight.supportingValue && (
                <div className="insight-value">{insight.supportingValue}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
