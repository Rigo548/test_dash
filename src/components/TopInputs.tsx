import React, { useCallback } from 'react';
import { useBudget, budgetActions } from '../store/budgetStore';
import { formatCurrency } from '../utils/compute';

/**
 * Top-level input controls for budget parameters
 * Provides controls for total budget, target reduction, and future budget planning
 */
const TopInputs: React.FC = () => {
  const { state, dispatch } = useBudget();

  // Memoized handlers to prevent unnecessary re-renders
  const handleBudgetSliderChange = useCallback((value: number) => {
    if (typeof value === 'number' && isFinite(value) && value >= 0) {
      dispatch(budgetActions.setTotalBudget(value));
    }
  }, [dispatch]);

  const handleTargetChange = useCallback((value: number) => {
    if (typeof value === 'number' && isFinite(value) && value >= 0) {
      dispatch(budgetActions.setTarget(value));
    }
  }, [dispatch]);

  const handleFutureBudgetChange = useCallback((index: number, value: number) => {
    if (index >= 0 && index < 4 && typeof value === 'number' && isFinite(value) && value >= 0) {
      const newBudgets = [...state.futureBudgets];
      newBudgets[index] = value;
      dispatch(budgetActions.setFutureBudgets(newBudgets));
    }
  }, [dispatch, state.futureBudgets]);



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Annual Budget Card */}
      <div style={{
        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        borderRadius: '8px',
        padding: '12px',
        border: '1px solid #93c5fd',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            backgroundColor: '#3b82f6',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '8px'
          }}>
            <span style={{ color: 'white', fontSize: '14px' }}>💰</span>
          </div>
          <div>
            <h3 style={{ fontWeight: '600', color: '#1e3a8a', fontSize: '13px', margin: 0 }}>Annual Budget</h3>
            <p style={{ color: '#2563eb', fontSize: '11px', margin: 0 }}>Set your total allocation</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <input
            id="total-budget-slider"
            type="range"
            min="0"
            max="5000000"
            step="25000"
            value={state.totalBudget}
            onChange={(e) => handleBudgetSliderChange(Number(e.target.value))}
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#93c5fd',
              borderRadius: '4px',
              appearance: 'none',
              cursor: 'pointer'
            }}
            className="slider-thumb"
            aria-label="Total budget slider"
          />
          <div className="text-center">
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a' }}>
              {formatCurrency(state.totalBudget)}
            </div>
            <div style={{ fontSize: '14px', color: '#2563eb' }}>
              £0 - £5M range
            </div>
          </div>
        </div>
      </div>

      {/* Carbon Target Card */}
      <div style={{
        background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
        borderRadius: '12px',
        padding: '24px',
        border: '2px solid #86efac',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <div className="flex items-center mb-4">
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#22c55e',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px'
          }}>
            <span className="text-white text-lg">🎯</span>
          </div>
          <div>
            <h3 style={{ fontWeight: '600', color: '#14532d', fontSize: '16px' }}>Reduction Target</h3>
            <p style={{ color: '#16a34a', fontSize: '14px' }}>Annual CO₂ goal (tCO₂e)</p>
          </div>
        </div>
        
        <div className="relative">
          <input
            id="annual-target"
            type="number"
            min="0"
            step="100"
            value={state.targetT}
            onChange={(e) => {
              const value = e.target.value;
              const numValue = value === '' ? 0 : Number(value);
              if (value === '' || (!isNaN(numValue) && isFinite(numValue) && numValue >= 0)) {
                handleTargetChange(numValue);
              }
            }}
            placeholder="3000"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '20px',
              fontWeight: 'bold',
              textAlign: 'center',
              border: '2px solid #86efac',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#14532d'
            }}
            aria-label="Annual CO2 reduction target in tonnes"
          />
        </div>
      </div>

      {/* Future Budgets Card */}
      <div style={{
        background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
        borderRadius: '12px',
        padding: '24px',
        border: '2px solid #c4b5fd',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <div className="flex items-center mb-4">
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#8b5cf6',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px'
          }}>
            <span className="text-white text-lg">📅</span>
          </div>
          <div>
            <h3 style={{ fontWeight: '600', color: '#581c87', fontSize: '16px' }}>Future Planning</h3>
            <p style={{ color: '#7c3aed', fontSize: '14px' }}>Years 2-5 budgets</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {[2, 3, 4, 5].map((year, index) => (
            <div key={year} className="flex items-center space-x-3">
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#c4b5fd',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: '#581c87', fontWeight: '600', fontSize: '14px' }}>Y{year}</span>
              </div>
              <input
                type="number"
                min="0"
                step="10000"
                value={state.futureBudgets[index] || ''}
                onChange={(e) => handleFutureBudgetChange(index, Number(e.target.value) || 0)}
                placeholder={`${450000 - (index * 50000)}`}
                style={{
                  flex: '1',
                  padding: '8px 12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '2px solid #c4b5fd',
                  borderRadius: '8px',
                  backgroundColor: 'white'
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopInputs;