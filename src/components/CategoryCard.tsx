import React, { useMemo, useCallback } from 'react';
import { useBudget, budgetActions } from '../store/budgetStore';
import type { Category, Intervention } from '../types';
import { validateIntervention, isCategory } from '../types';

interface CategoryCardProps {
  cat: Category;
  interventions: Intervention[];
}

const validateProps = (props: CategoryCardProps): void => {
  if (!isCategory(props.cat)) {
    throw new Error(`Invalid category: ${props.cat}`);
  }
  
  if (!Array.isArray(props.interventions)) {
    throw new Error('Interventions must be an array');
  }
  
  props.interventions.forEach((intervention, index) => {
    const validation = validateIntervention(intervention);
    if (!validation.isValid) {
      throw new Error(`Invalid intervention at index ${index}: ${validation.errors.join(', ')}`);
    }
  });
};

const CategoryCard: React.FC<CategoryCardProps> = ({ cat, interventions }) => {
  if (import.meta.env?.DEV) {
    validateProps({ cat, interventions });
  }
  
  const { state, dispatch } = useBudget();

  const categoryIcon = useMemo((): string => {
    const icons: Record<Category, string> = {
      'Electricity': '⚡',
      'Gas/Heating': '🔥',
      'Water': '💧',
      'Waste': '♻️',
      'Travel': '🚗'
    };
    return icons[cat];
  }, [cat]);

  const handleAllocationChange = useCallback((interventionId: string, amount: number) => {
    try {
      const cleanAmount = Math.max(0, Math.floor(amount));
      dispatch(budgetActions.setAllocation(interventionId, cleanAmount));
    } catch (error) {
      console.error('Error updating allocation:', error);
    }
  }, [dispatch]);

  const calculateAbatement = useCallback((intervention: Intervention, spend: number): number => {
    if (spend <= 0 || intervention.costPerT <= 0) return 0;
    return Math.min(spend / intervention.costPerT, intervention.maxTPerYear);
  }, []);

  // Calculate totals for this category
  const { subtotal, totalAbatement } = useMemo(() => {
    return interventions.reduce(
      (acc, intervention) => {
        const spend = state.allocations[intervention.id] || 0;
        const abatement = calculateAbatement(intervention, spend);
        return {
          subtotal: acc.subtotal + spend,
          totalAbatement: acc.totalAbatement + abatement,
        };
      },
      { subtotal: 0, totalAbatement: 0 }
    );
  }, [interventions, state.allocations, calculateAbatement]);

  const percentOfBudget = useMemo(() => {
    return state.totalBudget > 0 ? (subtotal / state.totalBudget) * 100 : 0;
  }, [subtotal, state.totalBudget]);

  // Check if we can distribute remaining budget
  const canDistribute = useCallback(() => {
    const totalAllocated = Object.values(state.allocations).reduce((sum, val) => sum + val, 0);
    const remaining = state.totalBudget - totalAllocated;
    return remaining > 0 && interventions.some(int => {
      const currentSpend = state.allocations[int.id] || 0;
      const currentAbatement = calculateAbatement(int, currentSpend);
      return currentAbatement < int.maxTPerYear;
    });
  }, [state.allocations, state.totalBudget, interventions, calculateAbatement]);

  // Distribute remaining budget by ROI (cost per tonne)
  const handleDistributeByROI = useCallback(() => {
    try {
      const totalAllocated = Object.values(state.allocations).reduce((sum, val) => sum + val, 0);
      let remainingBudget = state.totalBudget - totalAllocated;

      // Sort interventions by cost per tonne (most cost-effective first)
      const sortedInterventions = [...interventions].sort((a, b) => a.costPerT - b.costPerT);

      sortedInterventions.forEach(intervention => {
        if (remainingBudget <= 0) return;

        const currentSpend = state.allocations[intervention.id] || 0;
        const currentAbatement = calculateAbatement(intervention, currentSpend);
        const remainingCapacity = intervention.maxTPerYear - currentAbatement;

        if (remainingCapacity > 0) {
          const maxAdditionalSpend = remainingCapacity * intervention.costPerT;
          const additionalSpend = Math.min(remainingBudget, maxAdditionalSpend);
          const newTotal = currentSpend + additionalSpend;

          dispatch(budgetActions.setAllocation(intervention.id, newTotal));
          remainingBudget -= additionalSpend;
        }
      });
    } catch (error) {
      console.error('Error distributing budget by ROI:', error);
    }
  }, [state.allocations, state.totalBudget, interventions, dispatch, calculateAbatement]);

  const getCategoryColor = (category: Category) => {
    switch (category) {
      case 'Electricity':
        return { 
          bg: '#FEF3C7', 
          border: '#F59E0B', 
          icon: '#D97706', 
          text: '#92400E',
          gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          light: 'rgba(245, 158, 11, 0.1)',
          primary: '#F59E0B'
        };
      case 'Gas/Heating':
        return { 
          bg: '#FEE2E2', 
          border: '#EF4444', 
          icon: '#DC2626', 
          text: '#991B1B',
          gradient: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
          light: 'rgba(239, 68, 68, 0.1)',
          primary: '#EF4444'
        };
      case 'Water':
        return { 
          bg: '#DBEAFE', 
          border: '#3B82F6', 
          icon: '#2563EB', 
          text: '#1E40AF',
          gradient: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
          light: 'rgba(59, 130, 246, 0.1)',
          primary: '#3B82F6'
        };
      case 'Waste':
        return { 
          bg: '#D1FAE5', 
          border: '#10B981', 
          icon: '#059669', 
          text: '#065F46',
          gradient: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
          light: 'rgba(16, 185, 129, 0.1)',
          primary: '#10B981'
        };
      default:
        return { 
          bg: '#F3F4F6', 
          border: '#6B7280', 
          icon: '#4B5563', 
          text: '#374151',
          gradient: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
          light: 'rgba(107, 114, 128, 0.1)',
          primary: '#6B7280'
        };
    }
  };  const categoryColors = getCategoryColor(cat);

  return (
    <div style={{
      background: categoryColors.bg,
      borderRadius: '12px',
      padding: '12px',
      border: `2px solid ${categoryColors.border}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease',
      height: 'fit-content'
    }}>
      {/* Card Header - Compact */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{
          width: '24px',
          height: '24px',
          background: categoryColors.gradient,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${categoryColors.border}`
        }}>
          <span style={{ fontSize: '12px' }}>{categoryIcon}</span>
        </div>
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: categoryColors.text, margin: '0 0 2px 0' }}>
            {cat}
          </h3>
          <p style={{ fontSize: '10px', color: categoryColors.text + 'bb', margin: '0' }}>
            {interventions.length} interventions
          </p>
        </div>
      </div>

      {/* Auto-fill Section - Compact */}
      {canDistribute() && (
        <div style={{
          marginBottom: '8px',
          padding: '6px 8px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
          borderRadius: '8px',
          border: `1px solid ${categoryColors.border}44`,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px' }}>🎯</span>
              <span style={{ fontSize: '9px', color: categoryColors.text, fontWeight: '600' }}>
                Smart fill
              </span>
            </div>
            <button
              onClick={handleDistributeByROI}
              style={{
                padding: '3px 6px',
                fontSize: '9px',
                fontWeight: '600',
                color: 'white',
                background: `linear-gradient(135deg, ${categoryColors.icon} 0%, ${categoryColors.icon}dd 100%)`,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s ease'
              }}
            >
              Fill ROI
            </button>
          </div>
        </div>
      )}

      {/* Interventions List - Compact */}
      <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '8px' }}>
        {interventions.map(intervention => {
          const currentSpend = state.allocations[intervention.id] || 0;
          const currentAbatement = calculateAbatement(intervention, currentSpend);
          const isAtMax = currentAbatement >= intervention.maxTPerYear;
          const categoryColor = getCategoryColor(cat);

          return (
            <div 
              key={intervention.id} 
              style={{
                marginBottom: '4px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.98) 100%)',
                border: '1px solid rgba(229,231,235,0.6)',
                borderRadius: '6px',
                padding: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
                position: 'relative' as const
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '2px',
                height: '100%',
                background: categoryColor.primary,
                borderRadius: '0 3px 3px 0'
              }}></div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '6px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '2px',
                    lineHeight: '1.2',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' as const
                  }}>
                    {intervention.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{
                      background: categoryColor.light,
                      color: categoryColor.text,
                      padding: '1px 4px',
                      borderRadius: '8px',
                      fontSize: '8px',
                      fontWeight: '600'
                    }}>
                      £{intervention.costPerT.toLocaleString()}/t
                    </span>
                    <span style={{
                      background: 'rgba(156,163,175,0.1)',
                      color: '#6B7280',
                      padding: '1px 4px',
                      borderRadius: '8px',
                      fontSize: '8px',
                      fontWeight: '600'
                    }}>
                      Max: {(intervention.maxTPerYear/1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px'
                }}>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={currentSpend || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : Number(value);
                      if (value === '' || (!isNaN(numValue) && isFinite(numValue) && numValue >= 0)) {
                        handleAllocationChange(intervention.id, numValue);
                      }
                    }}
                    placeholder="0"
                    style={{
                      width: '60px',
                      padding: '2px 4px',
                      fontSize: '9px',
                      fontWeight: '600',
                      textAlign: 'right' as const,
                      border: `1px solid ${categoryColor.border}`,
                      borderRadius: '4px',
                      background: 'white',
                      color: '#111827',
                      outline: 'none'
                    }}
                  />
                  {currentSpend > 0 && (
                    <div style={{
                      padding: '2px 4px',
                      background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                      color: '#065F46',
                      borderRadius: '4px',
                      fontSize: '8px',
                      fontWeight: '700',
                      border: '1px solid #6EE7B7',
                      whiteSpace: 'nowrap' as const
                    }}>
                      {currentAbatement.toFixed(0)}t
                      {isAtMax && <span style={{ color: '#D97706' }}>•M</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Summary */}
      {subtotal > 0 && (
        <div style={{
          borderTop: `3px solid ${getCategoryColor(cat).border}`,
          paddingTop: '20px',
          background: `linear-gradient(135deg, ${getCategoryColor(cat).bg} 0%, rgba(255,255,255,0.8) 100%)`,
          borderRadius: '0 0 20px 20px',
          margin: '0 -24px -24px -24px',
          padding: '20px 24px 24px 24px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#111827',
                marginBottom: '4px'
              }}>
                £{(subtotal/1000).toFixed(0)}k
              </div>
              <div style={{
                fontSize: '11px',
                color: '#6B7280',
                fontWeight: '600',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px'
              }}>
                Total Spend
              </div>
            </div>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#059669',
                marginBottom: '4px'
              }}>
                {totalAbatement.toFixed(0)}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#6B7280',
                fontWeight: '600',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px'
              }}>
                tCO₂e Reduced
              </div>
            </div>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '800',
                color: subtotal > 0 ? '#D97706' : '#6B7280',
                marginBottom: '4px'
              }}>
                £{subtotal > 0 ? (subtotal / totalAbatement).toFixed(0) : '0'}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#6B7280',
                fontWeight: '600',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px'
              }}>
                Cost per tCO₂e
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center' as const }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 20px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '700',
              background: percentOfBudget > 25 ? 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)' : 
                         percentOfBudget > 15 ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' : 
                         'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
              color: percentOfBudget > 25 ? '#991B1B' : 
                     percentOfBudget > 15 ? '#92400E' : '#065F46',
              border: `2px solid ${percentOfBudget > 25 ? '#F87171' : 
                                  percentOfBudget > 15 ? '#FBBF24' : '#6EE7B7'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <span style={{ marginRight: '8px', fontSize: '16px' }}>
                {percentOfBudget > 25 ? '⚠️' : percentOfBudget > 15 ? '⚡' : '✅'}
              </span>
              {percentOfBudget.toFixed(1)}% of Total Budget
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryCard;