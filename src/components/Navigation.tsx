import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

export const Navigation: React.FC = () => {
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-logo">MoneyLens</div>
        <div className="nav-links">
          <NavLink to="/dashboard" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Dashboard</NavLink>
          <NavLink to="/transactions" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Transactions</NavLink>
          <NavLink to="/food" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Food</NavLink>
          <NavLink to="/investments" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Investments</NavLink>
          <NavLink to="/insights" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Insights</NavLink>
          <NavLink to="/add" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Add New</NavLink>
        </div>
      </div>
    </nav>
  );
};
