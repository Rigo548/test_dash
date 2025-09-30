import React, { useMemo } from 'react';
import { useBudget } from '../store/budgetStore';
import { interventionsCatalog } from '../mock/catalog';
import {
  computePortfolioMetrics,
  formatCurrency,
  formatTonnes,
  calculateEfficiencyScore,
  calculateTargetProgress,
  type EfficiencyScore,
} from '../utils/compute';

/**
 * Professional KPI Dashboard Component
 * Displays real-time metrics for budget allocation and carbon reduction performance
 */
const KPIs: React.FC = () => {
  const { state } = useBudget();

  // Memoize expensive portfolio calculations
  const portfolioMetrics = useMemo(() => {
    try {
      return computePortfolioMetrics(
        interventionsCatalog,
        state.allocations,
        state.totalBudget,
        state.targetT
      );
    } catch (error) {
      console.error('Error computing portfolio metrics:', error);
      return {
        portfolioSpend: 0,
        portfolioAbatement: 0,
        portfolioCostPerT: 0,
        gapToTarget: state.targetT,
        budgetUtilisation: 0,
      };
    }
  }, [state.allocations, state.totalBudget, state.targetT]);

  const {
    portfolioSpend,
    portfolioAbatement,
    portfolioCostPerT,
    gapToTarget,
    budgetUtilisation,
  } = portfolioMetrics;

  // Memoize additional derived metrics
  const derivedMetrics = useMemo(() => {
    try {
      const targetProgress = calculateTargetProgress(portfolioAbatement, state.targetT);
      const efficiencyScore = calculateEfficiencyScore(portfolioCostPerT);
      const remainingBudget = state.totalBudget - portfolioSpend;
      const activeInterventions = Object.keys(state.allocations).filter(key => (state.allocations[key] || 0) > 0).length;
      
      return {
        targetProgress,
        efficiencyScore,
        remainingBudget,
        activeInterventions
      };
    } catch (error) {
      console.error('Error calculating derived metrics:', error);
      return {
        targetProgress: 0,
        efficiencyScore: 'poor' as EfficiencyScore,
        remainingBudget: state.totalBudget,
        activeInterventions: 0
      };
    }
  }, [portfolioAbatement, portfolioCostPerT, portfolioSpend, state.targetT, state.totalBudget, state.allocations]);

  const { targetProgress, efficiencyScore, remainingBudget } = derivedMetrics;

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
      gap: '12px',
      width: '100%'
    }}>
      {/* Total Budget Card */}
      <div style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        borderRadius: '12px',
        padding: '12px',
        border: '2px solid #f59e0b',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        minHeight: '100px',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '24px' }}>💰</span>
          </div>
          <div style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: budgetUtilisation > 90 ? '#fee2e2' : budgetUtilisation > 75 ? '#fef3c7' : '#dcfce7',
            color: budgetUtilisation > 90 ? '#dc2626' : budgetUtilisation > 75 ? '#d97706' : '#16a34a'
          }}>
            {budgetUtilisation.toFixed(0)}%
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: '500', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Total Budget (£)
          </h3>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>
            {formatCurrency(portfolioSpend).replace('£', '')}
          </div>
          <div style={{ fontSize: '14px', color: '#a16207' }}>
            {formatCurrency(remainingBudget)} remaining
          </div>
        </div>
      </div>

      {/* Target Progress Card */}
      <div style={{
        background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid #22c55e',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
        minHeight: '160px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '24px' }}>🎯</span>
          </div>
          <div style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: targetProgress >= 100 ? '#dcfce7' : targetProgress >= 75 ? '#dbeafe' : '#fef3c7',
            color: targetProgress >= 100 ? '#16a34a' : targetProgress >= 75 ? '#2563eb' : '#d97706'
          }}>
            {Math.round(targetProgress)}%
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: '500', color: '#14532d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Target Progress
          </h3>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#14532d', marginBottom: '4px' }}>
            {formatTonnes(portfolioAbatement).replace(' tCO₂e', '')}
          </div>
          <div style={{ fontSize: '14px', color: '#166534' }}>
            of {formatTonnes(state.targetT).replace(' tCO₂e', '')} tCO₂e target
          </div>
        </div>
      </div>

      {/* Cost Efficiency Card */}
      <div style={{
        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid #3b82f6',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
        minHeight: '160px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '24px' }}>⚡</span>
          </div>
          <div style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: efficiencyScore === 'excellent' ? '#dcfce7' : efficiencyScore === 'good' ? '#dbeafe' : efficiencyScore === 'fair' ? '#fef3c7' : '#fee2e2',
            color: efficiencyScore === 'excellent' ? '#16a34a' : efficiencyScore === 'good' ? '#2563eb' : efficiencyScore === 'fair' ? '#d97706' : '#dc2626'
          }}>
            {efficiencyScore}
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: '500', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Cost per Tonne
          </h3>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>
            {portfolioAbatement > 0 ? formatCurrency(portfolioCostPerT).replace('£', '') : '—'}
          </div>
          <div style={{ fontSize: '14px', color: '#1e40af' }}>
            £/tCO₂e average
          </div>
        </div>
      </div>

      {/* Gap to Target Card */}
      <div style={{
        background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid #f97316',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
        minHeight: '160px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '24px' }}>📊</span>
          </div>
          <div style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: gapToTarget <= 0 ? '#dcfce7' : '#fee2e2',
            color: gapToTarget <= 0 ? '#16a34a' : '#dc2626'
          }}>
            {gapToTarget <= 0 ? 'Complete' : 'Gap'}
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: '500', color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Gap to Target
          </h3>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#9a3412', marginBottom: '4px' }}>
            {gapToTarget <= 0 ? '0' : formatTonnes(gapToTarget).replace(' tCO₂e', '')}
          </div>
          <div style={{ fontSize: '14px', color: '#c2410c' }}>
            {gapToTarget <= 0 ? 'Target achieved!' : 'tCO₂e still needed'}
          </div>
        </div>
      </div>

      {/* Active Interventions Card */}
      <div style={{
        background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid #8b5cf6',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
        minHeight: '160px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '24px' }}>📋</span>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: '500', color: '#581c87', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Active Interventions
          </h3>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#581c87', marginBottom: '4px' }}>
            {Object.values(state.allocations).filter(val => val > 0).length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b21a8' }}>
            of {interventionsCatalog.length} available
          </div>
        </div>
      </div>

      {/* Budget Remaining Card */}
      <div style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid #0ea5e9',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
        minHeight: '160px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '24px' }}>💳</span>
          </div>
          <div style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: remainingBudget < 0 ? '#fee2e2' : '#f0f9ff',
            color: remainingBudget < 0 ? '#dc2626' : '#0369a1'
          }}>
            {remainingBudget < 0 ? 'Over' : 'Available'}
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: '500', color: '#0c4a6e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Budget Remaining
          </h3>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0c4a6e', marginBottom: '4px' }}>
            {formatCurrency(Math.abs(remainingBudget)).replace('£', '')}
          </div>
          <div style={{ fontSize: '14px', color: '#0369a1' }}>
            {remainingBudget < 0 ? 'over budget' : 'available to allocate'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIs;