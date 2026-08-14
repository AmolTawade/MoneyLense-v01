import type { Transaction } from '../types/Transaction';

// We define a single constant key so we never misspell it in different functions.
const STORAGE_KEY = 'moneylens_transactions_v1';

export const storageService = {
  /**
   * 1. Read all transactions from localStorage
   */
  getTransactions: (): Transaction[] => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      
      // Handle the case where no transactions exist yet
      if (!storedData) {
        return []; 
      }
      
      // Parse the JSON string back into an array of Transaction objects
      return JSON.parse(storedData) as Transaction[];
    } catch (error) {
      // Safely handle corrupted JSON data so the app doesn't crash
      console.error('Failed to parse transactions from localStorage:', error);
      return []; 
    }
  },

  /**
   * 2. Save an entire array of transactions to localStorage
   */
  saveTransactions: (transactions: Transaction[]): void => {
    try {
      // Convert the array of JavaScript objects into a JSON string
      const jsonString = JSON.stringify(transactions);
      localStorage.setItem(STORAGE_KEY, jsonString);
    } catch (error) {
      console.error('Failed to save transactions to localStorage:', error);
    }
  },

  /**
   * 3. Add a single transaction
   * We get the existing array, add the new item, and save the whole array back.
   */
  addTransaction: (transaction: Transaction): void => {
    const existingTransactions = storageService.getTransactions();
    const updatedTransactions = [...existingTransactions, transaction];
    storageService.saveTransactions(updatedTransactions);
  },

  /**
   * 4. Remove a single transaction by ID
   * We get the existing array, filter out the deleted ID, and save it back.
   */
  removeTransaction: (id: string): void => {
    const existingTransactions = storageService.getTransactions();
    const updatedTransactions = existingTransactions.filter((transaction) => transaction.id !== id);
    storageService.saveTransactions(updatedTransactions);
  },

  /**
   * 5. Clear all transactions completely
   */
  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
