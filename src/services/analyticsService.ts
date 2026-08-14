import type { Transaction, TransactionType } from '../types/Transaction';

// Helper to get start and end dates for a given month relative to today
const getMonthRange = (offsetMonths: number = 0) => {
  const date = new Date();
  date.setMonth(date.getMonth() + offsetMonths);
  const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
  return { start, end };
};

export const analyticsService = {
  // --- Core Calculations ---
  
  getTotalByType: (transactions: Transaction[], type: TransactionType): number => {
    return transactions
      .filter((t) => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getNetCashFlow: (transactions: Transaction[]): number => {
    const income = analyticsService.getTotalByType(transactions, 'INCOME');
    const expenses = analyticsService.getTotalByType(transactions, 'EXPENSE');
    return income - expenses;
  },

  getTransactionCount: (transactions: Transaction[]): number => {
    return transactions.length;
  },

  getAverageByType: (transactions: Transaction[], type: TransactionType): number => {
    const filtered = transactions.filter((t) => t.type === type);
    if (filtered.length === 0) return 0;
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);
    return total / filtered.length;
  },

  // --- Time-based Calculations ---

  getTotalsForDateRange: (transactions: Transaction[], startDate: string, endDate: string, type: TransactionType): number => {
    return transactions
      .filter((t) => t.type === type && t.date >= startDate && t.date <= endDate)
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getCurrentMonthTotal: (transactions: Transaction[], type: TransactionType): number => {
    const { start, end } = getMonthRange(0);
    return analyticsService.getTotalsForDateRange(transactions, start, end, type);
  },

  getPreviousMonthTotal: (transactions: Transaction[], type: TransactionType): number => {
    const { start, end } = getMonthRange(-1);
    return analyticsService.getTotalsForDateRange(transactions, start, end, type);
  },

  calculatePercentageChange: (current: number, previous: number): number | null => {
    if (previous === 0) {
      return null;
    }
    return ((current - previous) / previous) * 100;
  },

  // --- Category Analytics ---

  getSpendingByCategory: (transactions: Transaction[]) => {
    const expenses = transactions.filter((t) => t.type === 'EXPENSE');
    const categoryTotals: Record<string, number> = {};

    expenses.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  },

  getInvestmentsByType: (transactions: Transaction[]) => {
    const investments = transactions.filter((t) => t.type === 'INVESTMENT');
    const typeTotals: Record<string, number> = {};

    investments.forEach((t) => {
      const typeStr = t.metadata && 'investmentType' in t.metadata && t.metadata.investmentType 
        ? t.metadata.investmentType 
        : 'OTHER';
      typeTotals[typeStr] = (typeTotals[typeStr] || 0) + t.amount;
    });

    return Object.entries(typeTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  },

  getTopMerchants: (transactions: Transaction[], limit: number = 5) => {
    const expenses = transactions.filter((t) => t.type === 'EXPENSE');
    const merchantTotals: Record<string, number> = {};

    expenses.forEach((t) => {
      const m = t.merchant.trim() || 'Unknown';
      merchantTotals[m] = (merchantTotals[m] || 0) + t.amount;
    });

    return Object.entries(merchantTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  },

  // --- Time Analytics (Monthly Series for Charts) ---

  getMonthlySpendingSeries: (transactions: Transaction[]) => {
    const expenses = transactions.filter(t => t.type === 'EXPENSE');
    const monthlyTotals: Record<string, number> = {};

    expenses.forEach(t => {
      // Get YYYY-MM
      const monthStr = t.date.substring(0, 7);
      monthlyTotals[monthStr] = (monthlyTotals[monthStr] || 0) + t.amount;
    });

    return Object.entries(monthlyTotals)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort chronological
  },
  
  getMonthlyIncomeVsExpenseSeries: (transactions: Transaction[]) => {
    const relevant = transactions.filter(t => t.type === 'EXPENSE' || t.type === 'INCOME');
    const monthlyData: Record<string, { income: number, expense: number }> = {};

    relevant.forEach(t => {
      const monthStr = t.date.substring(0, 7);
      if (!monthlyData[monthStr]) {
        monthlyData[monthStr] = { income: 0, expense: 0 };
      }
      if (t.type === 'EXPENSE') {
        monthlyData[monthStr].expense += t.amount;
      } else {
        monthlyData[monthStr].income += t.amount;
      }
    });

    return Object.entries(monthlyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  // --- Food Specific Analytics ---

  filterByDateRangeStrict: (transactions: Transaction[], period: string): Transaction[] => {
    if (period === 'ALL_TIME') return transactions;
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'THIS_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'LAST_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return transactions.filter(t => new Date(t.date) >= startDate && new Date(t.date) <= endDate);
    } else if (period === 'LAST_3_MONTHS') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else if (period === 'LAST_6_MONTHS') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    } else if (period === 'LAST_12_MONTHS') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    }
    
    return transactions.filter(t => new Date(t.date) >= startDate);
  },

  getFoodTransactions: (transactions: Transaction[]) => {
    return transactions.filter(t => t.category === 'FOOD');
  },

  getFoodSpendingByDimension: (foodTransactions: Transaction[], dimension: 'platform' | 'restaurant' | 'mealType') => {
    const totals: Record<string, number> = {};
    foodTransactions.forEach(t => {
      let key = 'Other';
      if (t.metadata && dimension in t.metadata) {
        // @ts-ignore
        const val = t.metadata[dimension];
        if (val) key = val;
      }
      totals[key] = (totals[key] || 0) + t.amount;
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  },

  getFoodPlatformInsights: (foodTransactions: Transaction[]) => {
    const data = analyticsService.getFoodSpendingByDimension(foodTransactions, 'platform');
    if (data.length === 0) return null;
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const top = data[0];
    if (top.name === 'Other') return null;
    const percentage = Math.round((top.value / total) * 100);
    return `${top.name} accounts for ${percentage}% of your food spending this period.`;
  },

  getTopRestaurantInsight: (foodTransactions: Transaction[]) => {
    const data = analyticsService.getFoodSpendingByDimension(foodTransactions, 'restaurant');
    if (data.length === 0 || data[0].name === 'Other') return null;
    return { name: data[0].name, amount: data[0].value };
  },

  // --- Nutrition Analytics ---
  getNutritionTransactions: (foodTransactions: Transaction[]) => {
    return foodTransactions.filter(t => t.metadata && ('calories' in t.metadata || 'protein' in t.metadata));
  },

  getTotalNutrition: (foodTransactions: Transaction[]) => {
    const nutritionTx = analyticsService.getNutritionTransactions(foodTransactions);
    let calories = 0, protein = 0, carbohydrates = 0, fat = 0;
    
    nutritionTx.forEach(t => {
      if (t.metadata && 'calories' in t.metadata) {
        calories += t.metadata.calories || 0;
        // @ts-ignore
        protein += t.metadata.protein || 0;
        // @ts-ignore
        carbohydrates += t.metadata.carbohydrates || 0;
        // @ts-ignore
        fat += t.metadata.fat || 0;
      }
    });
    
    return { 
      calories, 
      protein, 
      carbohydrates, 
      fat, 
      hasData: nutritionTx.length > 0,
      averageCalories: nutritionTx.length > 0 ? calories / nutritionTx.length : 0 
    };
  },

  getMonthlyCaloriesSeries: (foodTransactions: Transaction[]) => {
    const nutritionTx = analyticsService.getNutritionTransactions(foodTransactions);
    const monthlyTotals: Record<string, number> = {};

    nutritionTx.forEach(t => {
      if (t.metadata && 'calories' in t.metadata && t.metadata.calories) {
        const monthStr = t.date.substring(0, 7);
        monthlyTotals[monthStr] = (monthlyTotals[monthStr] || 0) + t.metadata.calories;
      }
    });

    return Object.entries(monthlyTotals)
      .map(([date, calories]) => ({ date, calories }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  // --- Investment Specific Analytics ---

  getInvestmentTransactions: (transactions: Transaction[]) => {
    return transactions.filter(t => t.type === 'INVESTMENT');
  },

  getInvestmentSpendingByDimension: (investmentTransactions: Transaction[], dimension: 'investmentType' | 'investmentName') => {
    const totals: Record<string, number> = {};
    investmentTransactions.forEach(t => {
      let key = dimension === 'investmentType' ? 'Other' : 'Unnamed Investment';
      if (t.metadata && dimension in t.metadata) {
        // @ts-ignore
        const val = t.metadata[dimension];
        if (val) key = val;
      }
      totals[key] = (totals[key] || 0) + t.amount;
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  },

  getMonthlyInvestmentSeries: (investmentTransactions: Transaction[]) => {
    const monthlyTotals: Record<string, number> = {};

    investmentTransactions.forEach(t => {
      const monthStr = t.date.substring(0, 7);
      monthlyTotals[monthStr] = (monthlyTotals[monthStr] || 0) + t.amount;
    });

    return Object.entries(monthlyTotals)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  getInvestmentTypeInsight: (investmentTransactions: Transaction[]) => {
    const data = analyticsService.getInvestmentSpendingByDimension(investmentTransactions, 'investmentType');
    if (data.length === 0) return null;
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const top = data[0];
    if (top.name === 'Other') return null;
    const percentage = Math.round((top.value / total) * 100);
    return `${top.name}${top.name.endsWith('s') ? '' : 's'} account for ${percentage}% of your investments this period.`;
  },

  getTopInvestmentInsight: (investmentTransactions: Transaction[]) => {
    const data = analyticsService.getInvestmentSpendingByDimension(investmentTransactions, 'investmentName');
    if (data.length === 0 || data[0].name === 'Unnamed Investment') return null;
    return { name: data[0].name, amount: data[0].value };
  },

  getInvestmentMoMInsight: (currentMonthAmount: number, previousMonthAmount: number) => {
    if (previousMonthAmount === 0 || currentMonthAmount === 0) return null;
    const change = analyticsService.calculatePercentageChange(currentMonthAmount, previousMonthAmount);
    if (change === null) return null;
    const absChange = Math.abs(Math.round(change));
    if (change > 0) {
      return `You invested ₹${currentMonthAmount.toLocaleString('en-IN')} this month, ${absChange}% more than last month.`;
    } else if (change < 0) {
      return `You invested ₹${currentMonthAmount.toLocaleString('en-IN')} this month, ${absChange}% less than last month.`;
    }
    return `You invested ₹${currentMonthAmount.toLocaleString('en-IN')} this month, exactly the same as last month.`;
  }
};
