import React from 'react';
import { useBudget } from '../store/budgetStore';

/**
 * Professional header bar with title and key metrics
 */
const Header: React.FC = () => {
  const { state } = useBudget();
  
  const totalAllocated = Object.values(state.allocations).reduce((sum, val) => sum + (val || 0), 0);
  const utilizationPercent = state.totalBudget > 0 ? (totalAllocated / state.totalBudget) * 100 : 0;

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carbon Budget Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Plan and optimize your carbon reduction portfolio
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Budget</div>
            <div className="text-lg font-semibold text-gray-900">
              £{state.totalBudget.toLocaleString()}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">Utilization</div>
            <div className={`text-lg font-semibold ${
              utilizationPercent > 90 ? 'text-red-600' : 
              utilizationPercent > 75 ? 'text-amber-600' : 'text-green-600'
            }`}>
              {utilizationPercent.toFixed(1)}%
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500">Target</div>
            <div className="text-lg font-semibold text-gray-900">
              {state.targetT.toLocaleString()} tCO₂e
            </div>
          </div>

          {/* Profile/Settings */}
          <div className="flex items-center space-x-2 pl-6 border-l border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">U</span>
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">Admin User</div>
              <div className="text-gray-500">Carbon Manager</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;