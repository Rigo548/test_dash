import React from 'react';
import CategoryCard from './CategoryCard';
import { getInterventionsByCategory } from '../mock/catalog';
import type { Category } from '../types';

const CategorySidebar: React.FC = () => {
  const categories: Category[] = [
    'Electricity',
    'Gas/Heating',
    'Water',
    'Waste',
    'Travel',
  ];

  return (
    <div className="bg-gray-50 border-r border-gray-200 h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Budget Categories</h2>
        <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {categories.map((category) => {
            const interventions = getInterventionsByCategory(category);
            return (
              <CategoryCard
                key={category}
                cat={category}
                interventions={interventions}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategorySidebar;