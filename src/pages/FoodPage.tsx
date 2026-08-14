import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { analyticsService } from '../services/analyticsService';
import type { Transaction } from '../types/Transaction';
import { formatCurrency } from '../utils/formatters';
import { TransactionList } from '../components/TransactionList';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import './FoodPage.css';
import '../pages/DashboardPage.css'; // Reuse KPI styles

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const KPICard = ({ title, value, isCurrency = false, subtitle = '' }: { title: string, value: number, isCurrency?: boolean, subtitle?: string }) => {
  return (
    <div className="kpi-card">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{isCurrency ? formatCurrency(value) : value.toLocaleString()}</div>
      {subtitle && <div className="kpi-change neutral">{subtitle}</div>}
    </div>
  );
};

export const FoodPage: React.FC = () => {
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

  const foodTransactions = useMemo(() => {
    return analyticsService.getFoodTransactions(periodTransactions);
  }, [periodTransactions]);

  // Financial Analytics
  const totalSpend = foodTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalOrders = foodTransactions.length;
  const avgOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;

  const platformData = analyticsService.getFoodSpendingByDimension(foodTransactions, 'platform');
  const restaurantData = analyticsService.getFoodSpendingByDimension(foodTransactions, 'restaurant').slice(0, 5); // top 5
  
  const platformInsight = analyticsService.getFoodPlatformInsights(foodTransactions);
  const restaurantInsight = analyticsService.getTopRestaurantInsight(foodTransactions);

  // Nutrition Analytics
  const nutrition = analyticsService.getTotalNutrition(foodTransactions);
  const caloriesSeries = analyticsService.getMonthlyCaloriesSeries(foodTransactions);

  return (
    <div className="food-page">
      <div className="food-header">
        <h1 style={{ margin: 0, fontWeight: 700 }}>Food Analytics</h1>
        <select className="time-filter" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="THIS_MONTH">This Month</option>
          <option value="LAST_MONTH">Last Month</option>
          <option value="LAST_3_MONTHS">Last 3 Months</option>
          <option value="LAST_6_MONTHS">Last 6 Months</option>
          <option value="LAST_12_MONTHS">Last 12 Months</option>
          <option value="ALL_TIME">All Time</option>
        </select>
      </div>

      {foodTransactions.length === 0 ? (
        <div className="empty-nutrition">No food transactions found for this period.</div>
      ) : (
        <>
          {/* Insights */}
          {platformInsight && (
            <div className="insight-card">
              <span style={{ fontSize: '20px' }}>💡</span>
              <span className="insight-text">{platformInsight}</span>
            </div>
          )}
          {restaurantInsight && (
            <div className="insight-card">
              <span style={{ fontSize: '20px' }}>🏆</span>
              <span className="insight-text">Your highest food spending is at {restaurantInsight.name} — {formatCurrency(restaurantInsight.amount)}.</span>
            </div>
          )}

          {/* Financial KPIs */}
          <div className="kpi-grid">
            <KPICard title="Food Spend" value={totalSpend} isCurrency={true} />
            <KPICard title="Food Orders" value={totalOrders} />
            <KPICard title="Average Order Value" value={avgOrderValue} isCurrency={true} />
            {nutrition.hasData ? (
              <KPICard title="Estimated Calories" value={nutrition.calories} subtitle="kcal total" />
            ) : (
              <KPICard title="Estimated Calories" value={0} subtitle="No data" />
            )}
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-title">Top Restaurants</div>
              <div style={{ width: '100%', height: 300 }}>
                {restaurantData.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={restaurantData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="var(--text-muted)" tickFormatter={(value) => `₹${value/1000}k`} />
                      <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={100} />
                      <Tooltip 
                        formatter={(value: any) => formatCurrency(Number(value))}
                        contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }}
                      />
                      <Bar dataKey="value" name="Amount" fill="var(--primary-color)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No restaurant data available.
                  </div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title">Spending by Platform</div>
              <div style={{ width: '100%', height: 300 }}>
                {platformData.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={platformData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {platformData.map((_, index) => (
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
                    No platform data available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nutrition Section */}
          <div className="section-divider">Nutrition Data</div>
          
          {!nutrition.hasData ? (
            <div className="empty-nutrition">
              Nutrition data isn't available for these orders yet.<br/>
              <span style={{ fontSize: '14px' }}>Add calories and macros to your food transactions to unlock this section.</span>
            </div>
          ) : (
            <>
              <div className="nutrition-kpi-grid">
                <KPICard title="Total Calories" value={nutrition.calories} subtitle="kcal" />
                <KPICard title="Avg Calories / Order" value={Math.round(nutrition.averageCalories)} subtitle="kcal" />
                <KPICard title="Total Protein" value={nutrition.protein} subtitle="grams" />
                <KPICard title="Total Carbs" value={nutrition.carbohydrates} subtitle="grams" />
              </div>

              {caloriesSeries.length > 0 && (
                <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="chart-card">
                    <div className="chart-title">Calories Trend</div>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <LineChart data={caloriesSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                          <XAxis dataKey="date" stroke="var(--text-muted)" />
                          <YAxis stroke="var(--text-muted)" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--bg-surface-hover)', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff' }}
                          />
                          <Line type="monotone" dataKey="calories" name="Calories" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Recent Food Transactions */}
          <div className="section-divider">Recent Food Orders</div>
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <TransactionList 
              transactions={[...foodTransactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)} 
              onDelete={handleDelete} 
            />
          </div>
        </>
      )}
    </div>
  );
};
