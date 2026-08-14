import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AddTransactionPage } from './pages/AddTransactionPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { DashboardPage } from './pages/DashboardPage';
import { FoodPage } from './pages/FoodPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { InsightsPage } from './pages/InsightsPage';
import { Navigation } from './components/Navigation';

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/food" element={<FoodPage />} />
        <Route path="/investments" element={<InvestmentsPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/add" element={<AddTransactionPage />} />
      </Routes>
    </Router>
  );
}

export default App;
