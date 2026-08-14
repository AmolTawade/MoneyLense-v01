import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Transaction, 
  TransactionType, 
  TransactionCategory, 
  InvestmentType,
  TransactionMetadata
} from '../types/Transaction';
import { storageService } from '../services/storageService';
import './AddTransactionForm.css';

const DEFAULT_DATE = new Date().toISOString().split('T')[0];

export const AddTransactionForm: React.FC = () => {
  // --- Core State ---
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(DEFAULT_DATE);
  const [category, setCategory] = useState<TransactionCategory>('FOOD');
  const [merchant, setMerchant] = useState<string>(''); // Used as Source for Income
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // --- Metadata State: Food ---
  const [platform, setPlatform] = useState<string>('');
  const [restaurant, setRestaurant] = useState<string>('');
  const [mealType, setMealType] = useState<string>('');
  const [calories, setCalories] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fat, setFat] = useState<string>('');

  // --- Metadata State: Investment ---
  const [investmentType, setInvestmentType] = useState<InvestmentType>('MUTUAL_FUND');
  const [investmentName, setInvestmentName] = useState<string>('');
  const [units, setUnits] = useState<string>('');

  // --- Metadata State: Transfer ---
  const [recipient, setRecipient] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');

  // --- UI State ---
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    // Reset defaults based on type
    if (newType === 'EXPENSE') setCategory('FOOD');
    if (newType === 'INVESTMENT') setCategory('INVESTMENT');
    if (newType === 'TRANSFER') setCategory('TRANSFER');
    if (newType === 'INCOME') setCategory('OTHER');
    setError(null);
    setIsSuccess(false);
  };

  const resetForm = () => {
    setAmount('');
    setDate(DEFAULT_DATE);
    setMerchant('');
    setDescription('');
    setPaymentMethod('');
    setNotes('');
    
    setPlatform('');
    setRestaurant('');
    setMealType('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    
    setInvestmentType('MUTUAL_FUND');
    setInvestmentName('');
    setUnits('');
    
    setRecipient('');
    setPurpose('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);

    // Validation
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }
    if (!date) {
      setError('Date is required.');
      return;
    }
    if ((type === 'EXPENSE' || type === 'INCOME') && !merchant.trim()) {
      setError(type === 'INCOME' ? 'Source is required.' : 'Merchant is required.');
      return;
    }

    // Build Metadata
    let metadata: TransactionMetadata | undefined = undefined;

    if (type === 'EXPENSE' && category === 'FOOD') {
      metadata = {
        platform: platform || undefined,
        restaurant: restaurant || undefined,
        mealType: mealType || undefined,
        calories: calories ? parseInt(calories) : undefined,
        protein: protein ? parseInt(protein) : undefined,
        carbohydrates: carbs ? parseInt(carbs) : undefined,
        fat: fat ? parseInt(fat) : undefined,
      };
    } else if (type === 'INVESTMENT') {
      metadata = {
        investmentType,
        investmentName: investmentName || undefined,
        units: units ? parseFloat(units) : undefined,
      };
    } else if (type === 'TRANSFER') {
      metadata = {
        recipient: recipient || undefined,
        purpose: purpose || undefined,
      };
    }

    // Build Transaction Object
    const newTransaction: Transaction = {
      id: uuidv4(),
      date,
      amount: parsedAmount,
      type,
      category,
      merchant: merchant.trim(),
      description: description.trim() || undefined,
      paymentMethod: paymentMethod.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      metadata,
    };

    // Save
    storageService.addTransaction(newTransaction);
    
    // UI Feedback
    setIsSuccess(true);
    resetForm();
    setTimeout(() => setIsSuccess(false), 2000);
  };

  return (
    <div className="form-container">
      <div className="type-selector">
        {(['EXPENSE', 'INVESTMENT', 'TRANSFER', 'INCOME'] as TransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`type-button ${type === t ? 'active' : ''}`}
            onClick={() => handleTypeChange(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        <div className="form-grid">
          {/* --- Core Fields --- */}
          <div className="form-group">
            <label>Amount</label>
            <input 
              type="number" 
              step="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0.00" 
            />
          </div>
          
          <div className="form-group">
            <label>Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>

          {type === 'EXPENSE' && (
            <>
              <div className="form-group">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as TransactionCategory)}>
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
              <div className="form-group">
                <label>Merchant / Platform</label>
                <input 
                  type="text" 
                  value={merchant} 
                  onChange={(e) => setMerchant(e.target.value)} 
                  placeholder="e.g. Amazon, Starbucks" 
                />
              </div>
            </>
          )}

          {type === 'INCOME' && (
            <div className="form-group full-width">
              <label>Source</label>
              <input 
                type="text" 
                value={merchant} 
                onChange={(e) => setMerchant(e.target.value)} 
                placeholder="e.g. Salary, Client" 
              />
            </div>
          )}

          {/* --- Food Metadata Fields --- */}
          {type === 'EXPENSE' && category === 'FOOD' && (
            <>
              <div className="section-title">Food Details (Optional)</div>
              <div className="form-group">
                <label>Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  <option value="">Select Platform...</option>
                  <option value="Zomato">Zomato</option>
                  <option value="Swiggy">Swiggy</option>
                  <option value="Dine-in">Dine-in</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Restaurant Name</label>
                <input type="text" value={restaurant} onChange={(e) => setRestaurant(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Meal Type</label>
                <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                  <option value="">Select Meal...</option>
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>
              <div className="form-group">
                <label>Calories (kcal)</label>
                <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Protein (g)</label>
                <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Carbs (g)</label>
                <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Fat (g)</label>
                <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
              </div>
            </>
          )}

          {/* --- Investment Metadata Fields --- */}
          {type === 'INVESTMENT' && (
            <>
              <div className="section-title">Investment Details</div>
              <div className="form-group">
                <label>Investment Type</label>
                <select value={investmentType} onChange={(e) => setInvestmentType(e.target.value as InvestmentType)}>
                  <option value="MUTUAL_FUND">Mutual Fund</option>
                  <option value="EQUITY">Equity</option>
                  <option value="GOLD">Gold</option>
                  <option value="FD">Fixed Deposit</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Investment Name</label>
                <input type="text" value={investmentName} onChange={(e) => setInvestmentName(e.target.value)} placeholder="e.g. Nifty 50 Index" />
              </div>
              <div className="form-group">
                <label>Units (Optional)</label>
                <input type="number" step="0.0001" value={units} onChange={(e) => setUnits(e.target.value)} />
              </div>
            </>
          )}

          {/* --- Transfer Metadata Fields --- */}
          {type === 'TRANSFER' && (
            <>
              <div className="section-title">Transfer Details</div>
              <div className="form-group">
                <label>Recipient</label>
                <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Name or Account" />
              </div>
              <div className="form-group">
                <label>Purpose</label>
                <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
              </div>
            </>
          )}

          {/* --- Optional Global Fields --- */}
          <div className="section-title">Additional Details</div>
          <div className="form-group full-width">
            <label>Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {type === 'EXPENSE' && (
            <div className="form-group">
              <label>Payment Method</label>
              <input type="text" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="Credit Card, UPI, etc." />
            </div>
          )}
          <div className={`form-group ${type !== 'EXPENSE' ? 'full-width' : ''}`}>
            <label>Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

        </div>

        {error && <div className="error-text">{error}</div>}

        <button type="submit" className={`submit-button ${isSuccess ? 'success' : ''}`}>
          {isSuccess ? '✓ Saved Successfully' : 'Save Transaction'}
        </button>
      </form>
    </div>
  );
};
