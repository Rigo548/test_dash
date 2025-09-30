/**
 * Available intervention categories for carbon reduction
 */
export type Category = 'Electricity' | 'Gas/Heating' | 'Water' | 'Waste' | 'Travel';

/**
 * Carbon reduction intervention definition
 */
export interface Intervention {
  /** Unique identifier for the intervention */
  id: string;
  /** Category this intervention belongs to */
  cat: Category;
  /** Human-readable name of the intervention */
  name: string;
  /** Cost per tonne of CO₂ equivalent (£/tCO₂e) - must be positive */
  costPerT: number;
  /** Maximum annual abatement potential (tCO₂e/year) - must be positive */
  maxTPerYear: number;
}

/**
 * Computed allocation row for reporting and analysis
 */
export interface AllocationRow {
  /** Category this allocation belongs to */
  cat: Category;
  /** Intervention identifier */
  interventionId: string;
  /** Amount spent on this intervention this year (£) */
  spend: number;
  /** Computed annual abatement (tCO₂e) */
  abatement: number;
  /** Computed cost per tonne (£/tCO₂e) */
  costPerT: number;
}

/**
 * Validation result for intervention data
 */
export interface ValidationResult {
  /** Whether the intervention data is valid */
  isValid: boolean;
  /** Error messages if validation failed */
  errors: string[];
}

/**
 * Chart data point for visualizations
 */
export interface ChartDataPoint {
  /** Label for this data point */
  label: string;
  /** Numerical value */
  value: number;
  /** Optional category for grouping */
  category?: Category;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Validate intervention data for correctness
 * @param intervention - The intervention to validate
 * @returns Validation result with errors if any
 */
export const validateIntervention = (intervention: unknown): ValidationResult => {
  const errors: string[] = [];
  
  if (!intervention || typeof intervention !== 'object') {
    return { isValid: false, errors: ['Intervention must be an object'] };
  }
  
  const i = intervention as Record<string, unknown>;
  
  if (!i.id || typeof i.id !== 'string' || i.id.trim().length === 0) {
    errors.push('Intervention must have a non-empty string id');
  }
  
  if (!i.name || typeof i.name !== 'string' || i.name.trim().length === 0) {
    errors.push('Intervention must have a non-empty string name');
  }
  
  const validCategories: Category[] = ['Electricity', 'Gas/Heating', 'Water', 'Waste', 'Travel'];
  if (!i.cat || !validCategories.includes(i.cat as Category)) {
    errors.push('Intervention must have a valid category');
  }
  
  if (typeof i.costPerT !== 'number' || !isFinite(i.costPerT) || i.costPerT <= 0) {
    errors.push('Intervention costPerT must be a positive finite number');
  }
  
  if (typeof i.maxTPerYear !== 'number' || !isFinite(i.maxTPerYear) || i.maxTPerYear <= 0) {
    errors.push('Intervention maxTPerYear must be a positive finite number');
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Type guard to check if value is a valid Category
 */
export const isCategory = (value: unknown): value is Category => {
  return typeof value === 'string' && 
    ['Electricity', 'Gas/Heating', 'Water', 'Waste', 'Travel'].includes(value);
};

/**
 * Type guard to check if value is a valid Intervention
 */
export const isIntervention = (value: unknown): value is Intervention => {
  return validateIntervention(value).isValid;
};