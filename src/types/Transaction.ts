export type TransactionType = 'EXPENSE' | 'INVESTMENT' | 'TRANSFER' | 'INCOME';

export type TransactionCategory =
  | 'FOOD'
  | 'SHOPPING'
  | 'GROCERIES'
  | 'BILLS'
  | 'TRANSPORT'
  | 'ENTERTAINMENT'
  | 'HEALTHCARE'
  | 'PERSONAL'
  | 'INVESTMENT'
  | 'TRANSFER'
  | 'OTHER';

export type InvestmentType = 'MUTUAL_FUND' | 'EQUITY' | 'GOLD' | 'FD' | 'OTHER';

export interface FoodMetadata {
  platform?: string;
  restaurant?: string;
  mealType?: string;
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
}

export interface InvestmentMetadata {
  investmentType?: InvestmentType;
  investmentName?: string;
  units?: number;
}

export interface TransferMetadata {
  recipient?: string;
  purpose?: string;
}

export type TransactionMetadata = FoodMetadata | InvestmentMetadata | TransferMetadata;

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  subcategory?: string;
  merchant: string;
  description?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  metadata?: TransactionMetadata;
}
