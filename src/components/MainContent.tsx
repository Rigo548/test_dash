import React from 'react';
import MACC from '../charts/MACC';
import AbatementVsTarget from '../charts/AbatementVsTarget';
import BudgetByCategory from '../charts/BudgetByCategory';
import { Trajectory } from '../charts/Trajectory';
import KPIs from './KPIs';

const MainContent: React.FC = () => {
  return (
    <div style={{ 
      flex: 1, 
      backgroundColor: '#f9fafb', 
      padding: '16px', 
      overflowY: 'auto',
      height: '100vh'
    }}>
      <div style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Dashboard Header */}
        <div style={{ marginBottom: '8px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: '0 0 4px 0' }}>Carbon Budget Dashboard</h1>
          <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>Monitor and optimize your carbon reduction investments</p>
        </div>

        {/* KPI Grid */}
        <KPIs />

        {/* Charts Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '16px',
          flex: 1
        }}>
          {/* MACC Chart */}
          <div style={{ gridColumn: '1 / -1' }}>
            <MACC />
          </div>
          
          {/* Abatement vs Target Chart */}
          <AbatementVsTarget />
          
          {/* Budget by Category Chart */}
          <BudgetByCategory />
          
          {/* Multi-Year Trajectory Chart */}
          <div style={{ gridColumn: '1 / -1' }}>
            <Trajectory />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContent;