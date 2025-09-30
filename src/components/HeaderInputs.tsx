import React from 'react';
import { useBudget, budgetActions } from '../store/budgetStore';

const HeaderInputs: React.FC = () => {
  const { state, dispatch } = useBudget();
  
  const handleBudgetChange = (value: number) => {
    dispatch(budgetActions.setTotalBudget(value));
  };
  
  const handleTargetChange = (value: number) => {
    dispatch(budgetActions.setTarget(value));
  };
  
  const handleFutureBudgetChange = (index: number, value: number) => {
    const newBudgets = [...state.futureBudgets];
    newBudgets[index] = value;
    dispatch(budgetActions.setFutureBudgets(newBudgets));
  };

  return (
    <div className="bg-white border-b border-gray-200 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Total Budget Slider */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Total Budget (This Year)
            </label>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <input
                type="range"
                min="0"
                max="1000000"
                value={state.totalBudget}
                onChange={(e) => handleBudgetChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="mt-2 text-center text-lg font-semibold text-gray-800">
                £{state.totalBudget.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Annual Reduction Target */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Annual Reduction Target (tCO₂e)
            </label>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <input
                type="number"
                placeholder="Enter target"
                value={state.targetT}
                onChange={(e) => handleTargetChange(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Multi-Year Budget */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Multi-Year Budget
            </label>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Year 2 £</label>
                  <input
                    type="number"
                    placeholder="Year 2"
                    value={state.futureBudgets[0] || 0}
                    onChange={(e) => handleFutureBudgetChange(0, Number(e.target.value))}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Year 3 £</label>
                  <input
                    type="number"
                    placeholder="Year 3"
                    value={state.futureBudgets[1] || 0}
                    onChange={(e) => handleFutureBudgetChange(1, Number(e.target.value))}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Year 4 £</label>
                  <input
                    type="number"
                    placeholder="Year 4"
                    value={state.futureBudgets[2] || 0}
                    onChange={(e) => handleFutureBudgetChange(2, Number(e.target.value))}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Year 5 £</label>
                  <input
                    type="number"
                    placeholder="Year 5"
                    value={state.futureBudgets[3] || 0}
                    onChange={(e) => handleFutureBudgetChange(3, Number(e.target.value))}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderInputs;