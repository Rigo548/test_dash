import type { Intervention } from '../types';

/**
 * Calculate carbon abatement for a single intervention based on spending
 * @param intervention - The intervention with cost and max abatement data
 * @param spend - Amount spent on this intervention (£)
 * @returns Annual carbon abatement (tCO₂e), capped at intervention's maximum
 * @throws Error if intervention data is invalid
 */
export const calculateInterventionAbatement = (
  intervention: Intervention,
  spend: number
): number => {
  // Input validation
  if (!intervention) {
    throw new Error('Intervention object is required');
  }
  if (typeof spend !== 'number' || !isFinite(spend)) {
    throw new Error('Spend must be a finite number');
  }
  if (intervention.costPerT <= 0) {
    throw new Error('Intervention costPerT must be positive');
  }
  if (intervention.maxTPerYear <= 0) {
    throw new Error('Intervention maxTPerYear must be positive');
  }
  
  if (spend <= 0) return 0;
  
  const theoreticalAbatement = spend / intervention.costPerT;
  return Math.min(intervention.maxTPerYear, theoreticalAbatement);
};

/**
 * Portfolio metrics calculation result
 */
export interface PortfolioMetrics {
  portfolioSpend: number;
  portfolioAbatement: number;
  portfolioCostPerT: number;
  gapToTarget: number;
  budgetUtilisation: number;
}

/**
 * Calculate comprehensive portfolio metrics from current allocations
 * @param catalog - Full catalog of available interventions
 * @param allocations - Current spending allocations by intervention ID
 * @param totalBudget - Total available budget (£)
 * @param targetT - Annual carbon reduction target (tCO₂e)
 * @returns Portfolio metrics including spend, abatement, efficiency, and gaps
 * @throws Error if input parameters are invalid
 */
export const computePortfolioMetrics = (
  catalog: Intervention[],
  allocations: Record<string, number>,
  totalBudget: number,
  targetT: number
): PortfolioMetrics => {
  // Input validation
  if (!Array.isArray(catalog)) {
    throw new Error('Catalog must be an array of interventions');
  }
  if (!allocations || typeof allocations !== 'object') {
    throw new Error('Allocations must be a valid object');
  }
  if (typeof totalBudget !== 'number' || !isFinite(totalBudget) || totalBudget < 0) {
    throw new Error('Total budget must be a non-negative finite number');
  }
  if (typeof targetT !== 'number' || !isFinite(targetT) || targetT < 0) {
    throw new Error('Target reduction must be a non-negative finite number');
  }
  let portfolioSpend = 0;
  let portfolioAbatement = 0;

  // Calculate totals across all interventions
  catalog.forEach(intervention => {
    const spend = allocations[intervention.id] || 0;
    portfolioSpend += spend;
    portfolioAbatement += calculateInterventionAbatement(intervention, spend);
  });

  // Calculate derived metrics
  const portfolioCostPerT = portfolioAbatement > 0 ? portfolioSpend / portfolioAbatement : 0;
  const gapToTarget = Math.max(0, targetT - portfolioAbatement);
  const budgetUtilisation = totalBudget > 0 ? (portfolioSpend / totalBudget) * 100 : 0;

  return {
    portfolioSpend,
    portfolioAbatement,
    portfolioCostPerT,
    gapToTarget,
    budgetUtilisation,
  };
};

/**
 * Format currency with smart units (k/M) for display
 * @param amount - Amount in pounds
 * @returns Formatted string like "£1.5M", "£250k", or "£1,234"
 * @throws Error if amount is not a valid number
 */
export const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || !isFinite(amount)) {
    throw new Error('Amount must be a finite number');
  }
  
  if (amount === 0) return '£0';
  
  // Handle negative amounts
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const prefix = isNegative ? '-£' : '£';
  
  if (absAmount >= 1000000) {
    return `${prefix}${(absAmount / 1000000).toFixed(1)}M`;
  }
  if (absAmount >= 1000) {
    return `${prefix}${(absAmount / 1000).toFixed(0)}k`;
  }
  return `${prefix}${Math.round(absAmount).toLocaleString()}`;
};

/**
 * Format currency exactly without abbreviations (for inputs/precise display)
 * @param amount - Amount in pounds
 * @returns Formatted string like "£1,500,000"
 * @throws Error if amount is not a valid number
 */
export const formatCurrencyExact = (amount: number): string => {
  if (typeof amount !== 'number' || !isFinite(amount)) {
    throw new Error('Amount must be a finite number');
  }
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const prefix = isNegative ? '-£' : '£';
  
  return `${prefix}${Math.round(absAmount).toLocaleString()}`;
};

/**
 * Format percentage with specified decimal places
 * @param value - Percentage value (e.g., 85.7 for 85.7%)
 * @param decimals - Number of decimal places (default 1)
 * @returns Formatted percentage string like "85.7%"
 * @throws Error if inputs are invalid
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new Error('Value must be a finite number');
  }
  if (typeof decimals !== 'number' || !Number.isInteger(decimals) || decimals < 0 || decimals > 10) {
    throw new Error('Decimals must be an integer between 0 and 10');
  }
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format carbon emissions with smart precision and units
 * @param value - Tonnes of CO₂ equivalent
 * @returns Formatted string like "1,234 tCO₂e" with appropriate precision
 * @throws Error if value is not a valid number
 */
export const formatTonnes = (value: number): string => {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new Error('Value must be a finite number');
  }
  if (value < 0) {
    throw new Error('Carbon emissions value cannot be negative');
  }
  
  if (value === 0) return '0 tCO₂e';
  if (value < 1) return `${value.toFixed(2)} tCO₂e`;
  if (value < 10) return `${value.toFixed(1)} tCO₂e`;
  return `${Math.round(value).toLocaleString()} tCO₂e`;
};

/**
 * Efficiency score categories
 */
export type EfficiencyScore = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * Categorize cost-effectiveness of interventions
 * @param costPerT - Cost per tonne of CO₂ (£/tCO₂e)
 * @returns Efficiency rating from 'excellent' to 'poor'
 * @throws Error if costPerT is invalid
 */
export const calculateEfficiencyScore = (costPerT: number): EfficiencyScore => {
  if (typeof costPerT !== 'number' || !isFinite(costPerT)) {
    throw new Error('Cost per tonne must be a finite number');
  }
  if (costPerT < 0) {
    throw new Error('Cost per tonne cannot be negative');
  }
  if (costPerT === 0) {
    return 'excellent'; // Free interventions are excellent
  }
  
  if (costPerT <= 50) return 'excellent';
  if (costPerT <= 100) return 'good';
  if (costPerT <= 150) return 'fair';
  return 'poor';
};

/**
 * Calculate progress towards annual carbon reduction target
 * @param abatement - Current projected abatement (tCO₂e)
 * @param target - Annual reduction target (tCO₂e)
 * @returns Progress percentage (0-100, capped at 100%)
 * @throws Error if inputs are invalid
 */
export const calculateTargetProgress = (abatement: number, target: number): number => {
  if (typeof abatement !== 'number' || !isFinite(abatement)) {
    throw new Error('Abatement must be a finite number');
  }
  if (typeof target !== 'number' || !isFinite(target)) {
    throw new Error('Target must be a finite number');
  }
  if (abatement < 0) {
    throw new Error('Abatement cannot be negative');
  }
  if (target < 0) {
    throw new Error('Target cannot be negative');
  }
  
  if (target === 0) return 0;
  return Math.min(100, (abatement / target) * 100);
};