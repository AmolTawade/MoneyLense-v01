import pandas as pd
import math
import json

df = pd.read_excel('MoneyLense_V01_Sample_Data.xlsx')
df = df.replace({float('nan'): None})

transactions = []
for idx, row in df.iterrows():
    metadata = {}
    
    category = str(row['category']).upper()
    if category == 'SALARY' or category == 'INCOME':
        category = 'OTHER'
    
    if row['type'] == 'EXPENSE' and category == 'FOOD':
        if row.get('platform'): metadata['platform'] = row['platform']
        if row.get('restaurant'): metadata['restaurant'] = row['restaurant']
        if row.get('mealType'): metadata['mealType'] = row['mealType']
        if row.get('calories') is not None: metadata['calories'] = int(row['calories'])
        if row.get('protein') is not None: metadata['protein'] = int(row['protein'])
        if row.get('carbohydrates') is not None: metadata['carbohydrates'] = int(row['carbohydrates'])
        if row.get('fat') is not None: metadata['fat'] = int(row['fat'])
        
    elif row['type'] == 'INVESTMENT':
        category = 'INVESTMENT'
        inv_type = str(row.get('investmentType')).upper().replace(' ', '_') if row.get('investmentType') else 'OTHER'
        metadata['investmentType'] = inv_type
        if row.get('investmentName'): metadata['investmentName'] = row['investmentName']
        if row.get('units') is not None: metadata['units'] = float(row['units'])
        
    elif row['type'] == 'TRANSFER':
        category = 'TRANSFER'
        if row.get('recipient'): metadata['recipient'] = row['recipient']
        if row.get('purpose'): metadata['purpose'] = row['purpose']

    t = {
        'id': str(row['id']),
        'date': str(row['date'])[:10],
        'amount': float(row['amount']),
        'type': str(row['type']),
        'category': category,
        'merchant': str(row['merchant']) if row.get('merchant') else 'Unknown',
        'createdAt': str(row['date'])[:10] + 'T12:00:00Z',
    }
    
    if row.get('description'): t['description'] = str(row['description'])
    if row.get('paymentMethod'): t['paymentMethod'] = str(row['paymentMethod'])
    if row.get('notes'): t['notes'] = str(row['notes'])
    
    if metadata:
        t['metadata'] = metadata
        
    transactions.append(t)

with open('src/data/demoData.ts', 'w') as f:
    f.write("import type { Transaction } from '../types/Transaction';\n\n")
    f.write("export const demoTransactions: Transaction[] = ")
    f.write(json.dumps(transactions, indent=2))
    f.write(";\n")
