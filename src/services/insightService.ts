import type { Transaction } from '../types/Transaction';
import { analyticsService } from './analyticsService';
import { formatCurrency } from '../utils/formatters';

export type InsightType = 
  | 'SPENDING_TREND' 
  | 'CATEGORY_SPIKE' 
  | 'FOOD_SPENDING' 
  | 'INVESTMENT_TREND' 
  | 'MERCHANT_SPENDING' 
  | 'SAVING_TREND' 
  | 'FREQUENCY' 
  | 'TRANSFER' 
  | 'GENERAL';

export type InsightTone = 'POSITIVE' | 'WARNING' | 'NEUTRAL' | 'INFO';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  tone: InsightTone;
  supportingValue?: string;
  icon?: string;
}

export const insightService = {
  generateInsights: (allTransactions: Transaction[], periodTransactions: Transaction[], period: string): Insight[] => {
    const insights: Insight[] = [];

    if (periodTransactions.length === 0) {
      return insights;
    }

    // 1. OVERALL SPENDING TREND
    const expenses = periodTransactions.filter(t => t.type === 'EXPENSE');
    const totalSpend = analyticsService.getTotalByType(periodTransactions, 'EXPENSE');
    
    if (period === 'THIS_MONTH' || period === 'ALL_TIME') {
      const currentMonthSpend = analyticsService.getCurrentMonthTotal(allTransactions, 'EXPENSE');
      const prevMonthSpend = analyticsService.getPreviousMonthTotal(allTransactions, 'EXPENSE');
      
      if (prevMonthSpend > 0) {
        const change = analyticsService.calculatePercentageChange(currentMonthSpend, prevMonthSpend);
        if (change !== null) {
          const absChange = Math.abs(Math.round(change));
          if (change > 0) {
            insights.push({
              id: 'spending_trend',
              type: 'SPENDING_TREND',
              title: 'Spending Increased',
              message: `You spent ${absChange}% more this month compared with last month.`,
              tone: 'WARNING',
              supportingValue: formatCurrency(currentMonthSpend),
              icon: '📈'
            });
          } else if (change < 0) {
            insights.push({
              id: 'spending_trend',
              type: 'SPENDING_TREND',
              title: 'Spending Decreased',
              message: `You spent ${absChange}% less this month compared with last month.`,
              tone: 'POSITIVE',
              supportingValue: formatCurrency(currentMonthSpend),
              icon: '📉'
            });
          }
        }
      }
    }

    // 2. HIGHEST SPENDING CATEGORY
    if (expenses.length > 0) {
      const categories = analyticsService.getSpendingByCategory(periodTransactions);
      if (categories.length > 0) {
        const topCat = categories[0];
        insights.push({
          id: 'highest_category',
          type: 'CATEGORY_SPIKE',
          title: 'Top Expense Category',
          message: `${topCat.name} is your highest spending category this period.`,
          tone: 'INFO',
          supportingValue: formatCurrency(topCat.value),
          icon: '🏷️'
        });
      }
    }

    // 3. CATEGORY SPIKE (MoM Increase >= 20%)
    if (period === 'THIS_MONTH' || period === 'ALL_TIME') {
      const currentMonthExpenses = analyticsService.filterByDateRangeStrict(allTransactions, 'THIS_MONTH').filter(t => t.type === 'EXPENSE');
      const prevMonthExpenses = analyticsService.filterByDateRangeStrict(allTransactions, 'LAST_MONTH').filter(t => t.type === 'EXPENSE');
      
      const currentCatTotals = analyticsService.getSpendingByCategory(currentMonthExpenses);
      const prevCatTotals = analyticsService.getSpendingByCategory(prevMonthExpenses);
      
      let highestSpikeCat: {name: string, value: number} | null = null;
      let highestSpikePercent = 0;

      for (const currentCat of currentCatTotals) {
        const prevCat = prevCatTotals.find(c => c.name === currentCat.name);
        if (prevCat && prevCat.value > 0) {
          const change = analyticsService.calculatePercentageChange(currentCat.value, prevCat.value);
          if (change !== null && change >= 20 && change > highestSpikePercent) {
            highestSpikePercent = change;
            highestSpikeCat = currentCat;
          }
        }
      }

      if (highestSpikeCat) {
        insights.push({
          id: 'category_spike',
          type: 'CATEGORY_SPIKE',
          title: 'Category Spending Spike',
          message: `Your ${highestSpikeCat.name} spending increased ${Math.round(highestSpikePercent)}% compared with last month.`,
          tone: 'WARNING',
          icon: '⚠️'
        });
      }
    }

    // 4. FOOD INSIGHT
    const foodTransactions = analyticsService.getFoodTransactions(periodTransactions);
    if (foodTransactions.length > 0 && totalSpend > 0) {
      const foodSpend = foodTransactions.reduce((sum, t) => sum + t.amount, 0);
      const foodPercentage = Math.round((foodSpend / totalSpend) * 100);
      
      insights.push({
        id: 'food_spending',
        type: 'FOOD_SPENDING',
        title: 'Food Spending',
        message: foodPercentage > 0 
          ? `Food accounts for ${foodPercentage}% of your total spending this period.`
          : `You spent ${formatCurrency(foodSpend)} on food this period.`,
        tone: foodPercentage > 30 ? 'WARNING' : 'INFO',
        supportingValue: formatCurrency(foodSpend),
        icon: '🍔'
      });
    }

    // 5. TOP MERCHANT
    if (expenses.length > 0) {
      const merchants = analyticsService.getTopMerchants(periodTransactions, 1);
      if (merchants.length > 0 && merchants[0].name !== 'Unknown') {
        const topMerchant = merchants[0];
        insights.push({
          id: 'top_merchant',
          type: 'MERCHANT_SPENDING',
          title: 'Top Merchant',
          message: `${topMerchant.name} is your highest-spending merchant this period.`,
          tone: 'NEUTRAL',
          supportingValue: formatCurrency(topMerchant.value),
          icon: '🏪'
        });
      }
    }

    // 6. INVESTMENT INSIGHT
    const investments = analyticsService.getInvestmentTransactions(periodTransactions);
    if (investments.length > 0) {
      const totalInvested = investments.reduce((sum, t) => sum + t.amount, 0);
      
      const types = analyticsService.getInvestmentSpendingByDimension(investments, 'investmentType');
      if (types.length > 0 && types[0].name !== 'Other') {
        const topType = types[0];
        const pct = Math.round((topType.value / totalInvested) * 100);
        insights.push({
          id: 'investment_trend',
          type: 'INVESTMENT_TREND',
          title: 'Investment Breakdown',
          message: `${topType.name}${topType.name.endsWith('s') ? '' : 's'} account for ${pct}% of your investments this period.`,
          tone: 'POSITIVE',
          supportingValue: formatCurrency(totalInvested),
          icon: '🏦'
        });
      } else {
        insights.push({
          id: 'investment_trend',
          type: 'INVESTMENT_TREND',
          title: 'Investments Made',
          message: `You successfully invested ${formatCurrency(totalInvested)} this period.`,
          tone: 'POSITIVE',
          icon: '🏦'
        });
      }
    }

    // 7. TRANSACTION FREQUENCY
    if (periodTransactions.length > 0) {
      let days = 30; 
      if (period === 'THIS_MONTH' || period === 'LAST_MONTH') days = 30;
      else if (period === 'LAST_3_MONTHS') days = 90;
      else if (period === 'LAST_6_MONTHS') days = 180;
      else if (period === 'LAST_12_MONTHS') days = 365;
      else {
        const dates = periodTransactions.map(t => new Date(t.date).getTime());
        const min = Math.min(...dates);
        const max = Math.max(...dates);
        days = Math.max(1, Math.ceil((max - min) / (1000 * 60 * 60 * 24)));
      }
      
      const avgPerDay = (periodTransactions.length / days).toFixed(1);
      
      insights.push({
        id: 'frequency',
        type: 'FREQUENCY',
        title: 'Transaction Frequency',
        message: `You made ${periodTransactions.length} transactions this period, averaging about ${avgPerDay} transactions per day.`,
        tone: 'NEUTRAL',
        icon: '⏱️'
      });
    }

    // 8. INCOME VS EXPENSE
    const income = analyticsService.getTotalByType(periodTransactions, 'INCOME');
    if (income > 0 || totalSpend > 0) {
      const net = income - totalSpend;
      if (net > 0) {
        insights.push({
          id: 'income_expense',
          type: 'SAVING_TREND',
          title: 'Positive Cash Flow',
          message: `Your income exceeded your spending by ${formatCurrency(net)} this period.`,
          tone: 'POSITIVE',
          icon: '💰'
        });
      } else if (net < 0) {
        insights.push({
          id: 'income_expense',
          type: 'SAVING_TREND',
          title: 'Negative Cash Flow',
          message: `Your spending exceeded your recorded income by ${formatCurrency(Math.abs(net))} this period.`,
          tone: 'WARNING',
          icon: '💸'
        });
      }
    }

    // 9. TRANSFER INSIGHT
    const transfers = analyticsService.getTotalByType(periodTransactions, 'TRANSFER');
    if (transfers > 0) {
      insights.push({
        id: 'transfer',
        type: 'TRANSFER',
        title: 'Money Transfers',
        message: `You transferred ${formatCurrency(transfers)} this period.`,
        tone: 'INFO',
        icon: '🔄'
      });
    }

    // Keep top 8 insights. Order by priority.
    const priorityOrder: InsightType[] = [
      'SAVING_TREND', 'SPENDING_TREND', 'CATEGORY_SPIKE', 'INVESTMENT_TREND', 
      'FOOD_SPENDING', 'MERCHANT_SPENDING', 'TRANSFER', 'FREQUENCY', 'GENERAL'
    ];

    insights.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.type);
      const bIndex = priorityOrder.indexOf(b.type);
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    });

    return insights.slice(0, 8);
  }
};
