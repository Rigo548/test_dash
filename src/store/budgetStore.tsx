import { createContext, useContext, useReducer, type ReactNode } from 'react';

/**
 * Validation result for state updates
 */
interface StateValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Main application state for budget planning
 */
export interface BudgetState {
  /** Total available budget for this year (£) */
  readonly totalBudget: number;
  /** Target CO2 reduction for this year (tCO₂e) */
  readonly targetT: number;
  /** Future year budgets [Year2, Year3, Year4, Year5] (£) */
  readonly futureBudgets: readonly number[];
  /** Intervention allocations: interventionId -> spend (£) for this year only */
  readonly allocations: Readonly<Record<string, number>>;
}

/**
 * Validate budget state for consistency and constraints
 */
const validateBudgetState = (state: Partial<BudgetState>): StateValidationResult => {
  if (state.totalBudget !== undefined) {
    if (typeof state.totalBudget !== 'number' || !isFinite(state.totalBudget) || state.totalBudget < 0) {
      return { isValid: false, error: 'Total budget must be a non-negative finite number' };
    }
  }
  
  if (state.targetT !== undefined) {
    if (typeof state.targetT !== 'number' || !isFinite(state.targetT) || state.targetT < 0) {
      return { isValid: false, error: 'Target reduction must be a non-negative finite number' };
    }
  }
  
  if (state.futureBudgets !== undefined) {
    if (!Array.isArray(state.futureBudgets) || state.futureBudgets.length !== 4) {
      return { isValid: false, error: 'Future budgets must be an array of exactly 4 numbers' };
    }
    
    for (let i = 0; i < state.futureBudgets.length; i++) {
      const budget = state.futureBudgets[i];
      if (typeof budget !== 'number' || !isFinite(budget) || budget < 0) {
        return { isValid: false, error: `Future budget at index ${i} must be a non-negative finite number` };
      }
    }
  }
  
  if (state.allocations !== undefined) {
    for (const [interventionId, spend] of Object.entries(state.allocations)) {
      if (typeof interventionId !== 'string' || interventionId.trim().length === 0) {
        return { isValid: false, error: 'Intervention ID must be a non-empty string' };
      }
      
      if (typeof spend !== 'number' || !isFinite(spend) || spend < 0) {
        return { isValid: false, error: `Allocation for ${interventionId} must be a non-negative finite number` };
      }
    }
  }
  
  return { isValid: true };
};

/**
 * Budget store action types with comprehensive validation
 */
export type BudgetAction =
  | { type: 'SET_TOTAL_BUDGET'; payload: number }
  | { type: 'SET_TARGET'; payload: number }
  | { type: 'SET_FUTURE_BUDGETS'; payload: number[] }
  | { type: 'SET_ALLOCATION'; payload: { interventionId: string; spend: number } }
  | { type: 'RESET_ALL_ALLOCATIONS' };

/**
 * Validate action payload before dispatching
 */
const validateAction = (action: BudgetAction): StateValidationResult => {
  switch (action.type) {
    case 'SET_TOTAL_BUDGET':
      return validateBudgetState({ totalBudget: action.payload });
    
    case 'SET_TARGET':
      return validateBudgetState({ targetT: action.payload });
    
    case 'SET_FUTURE_BUDGETS':
      return validateBudgetState({ futureBudgets: action.payload });
    
    case 'SET_ALLOCATION':
      const { interventionId, spend } = action.payload;
      if (typeof interventionId !== 'string' || interventionId.trim().length === 0) {
        return { isValid: false, error: 'Intervention ID must be a non-empty string' };
      }
      return validateBudgetState({ allocations: { [interventionId]: spend } });
    
    case 'RESET_ALL_ALLOCATIONS':
      return { isValid: true };
    
    default:
      return { isValid: false, error: 'Unknown action type' };
  }
};

/**
 * Initial application state with sensible defaults
 */
const initialState: BudgetState = Object.freeze({
  totalBudget: 500000, // £500k default budget
  targetT: 3000, // 3000 tCO2e default target
  futureBudgets: Object.freeze([450000, 400000, 350000, 300000]), // Years 2-5 with declining budgets
  allocations: Object.freeze({}), // No initial allocations
});

/**
 * Budget reducer with comprehensive validation and immutability guarantees
 */
function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  // Validate action before processing
  const validation = validateAction(action);
  if (!validation.isValid) {
    console.error(`Invalid action:`, action, `Error: ${validation.error}`);
    return state; // Return unchanged state on validation failure
  }
  
  try {
    switch (action.type) {
      case 'SET_TOTAL_BUDGET':
        return {
          ...state,
          totalBudget: action.payload,
        };
      
      case 'SET_TARGET':
        return {
          ...state,
          targetT: action.payload,
        };
      
      case 'SET_FUTURE_BUDGETS':
        // Ensure immutability by creating new array
        return {
          ...state,
          futureBudgets: Object.freeze([...action.payload]),
        };
      
      case 'SET_ALLOCATION':
        const { interventionId, spend } = action.payload;
        
        // Remove allocation if spend is 0, otherwise set it
        const newAllocations = { ...state.allocations };
        if (spend === 0) {
          delete newAllocations[interventionId];
        } else {
          newAllocations[interventionId] = spend;
        }
        
        return {
          ...state,
          allocations: Object.freeze(newAllocations),
        };
      
      case 'RESET_ALL_ALLOCATIONS':
        return {
          ...state,
          allocations: Object.freeze({}),
        };
      
      default:
        // TypeScript should prevent this, but handle it gracefully
        console.warn('Unknown action type:', (action as any).type);
        return state;
    }
  } catch (error) {
    console.error('Error in budget reducer:', error, 'Action:', action);
    return state; // Return unchanged state on error
  }
}

// Context
const BudgetContext = createContext<{
  state: BudgetState;
  dispatch: React.Dispatch<BudgetAction>;
} | undefined>(undefined);

/**
 * Enhanced budget provider with validation and error boundaries
 */
export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, initialState);
  
  // Validate state integrity in development mode
  if (import.meta.env?.DEV) {
    const validation = validateBudgetState(state);
    if (!validation.isValid) {
      console.error('Invalid budget state detected:', validation.error, state);
    }
  }

  return (
    <BudgetContext.Provider value={{ state, dispatch }}>
      {children}
    </BudgetContext.Provider>
  );
}

// Hook to use the budget store
export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}

/**
 * Type-safe action creators with built-in validation
 */
export const budgetActions = {
  /**
   * Set total available budget for this year
   * @param amount - Budget amount in GBP (must be non-negative)
   */
  setTotalBudget: (amount: number): BudgetAction => {
    if (typeof amount !== 'number' || !isFinite(amount) || amount < 0) {
      throw new Error(`Invalid total budget: ${amount}. Must be a non-negative finite number.`);
    }
    return {
      type: 'SET_TOTAL_BUDGET',
      payload: amount,
    };
  },
  
  /**
   * Set annual CO2 reduction target
   * @param target - Target reduction in tCO2e (must be non-negative)
   */
  setTarget: (target: number): BudgetAction => {
    if (typeof target !== 'number' || !isFinite(target) || target < 0) {
      throw new Error(`Invalid target: ${target}. Must be a non-negative finite number.`);
    }
    return {
      type: 'SET_TARGET',
      payload: target,
    };
  },
  
  /**
   * Set future year budgets (Years 2-5)
   * @param budgets - Array of exactly 4 budget amounts (must be non-negative)
   */
  setFutureBudgets: (budgets: number[]): BudgetAction => {
    if (!Array.isArray(budgets) || budgets.length !== 4) {
      throw new Error(`Invalid future budgets: must be array of exactly 4 numbers, got ${budgets?.length || 'undefined'}`);
    }
    
    budgets.forEach((budget, index) => {
      if (typeof budget !== 'number' || !isFinite(budget) || budget < 0) {
        throw new Error(`Invalid future budget at index ${index}: ${budget}. Must be a non-negative finite number.`);
      }
    });
    
    return {
      type: 'SET_FUTURE_BUDGETS',
      payload: budgets,
    };
  },
  
  /**
   * Set allocation for a specific intervention
   * @param interventionId - Unique intervention identifier (must be non-empty string)
   * @param spend - Allocation amount in GBP (must be non-negative)
   */
  setAllocation: (interventionId: string, spend: number): BudgetAction => {
    if (typeof interventionId !== 'string' || interventionId.trim().length === 0) {
      throw new Error(`Invalid intervention ID: ${interventionId}. Must be a non-empty string.`);
    }
    
    if (typeof spend !== 'number' || !isFinite(spend) || spend < 0) {
      throw new Error(`Invalid spend amount: ${spend}. Must be a non-negative finite number.`);
    }
    
    return {
      type: 'SET_ALLOCATION',
      payload: { interventionId: interventionId.trim(), spend },
    };
  },
  
  /**
   * Reset all intervention allocations to zero
   */
  resetAllAllocations: (): BudgetAction => ({
    type: 'RESET_ALL_ALLOCATIONS',
  }),
};

export default BudgetProvider;