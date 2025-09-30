// Mock data catalog for carbon reduction interventions
// Organized by category with realistic cost and emission reduction figures

import type { Intervention, Category } from '../types';

export const interventionsCatalog: Intervention[] = [
  // Electricity Category (3 interventions)
  {
    id: 'elec-001',
    cat: 'Electricity',
    name: 'LED Lighting Retrofit',
    costPerT: 45,
    maxTPerYear: 250
  },
  {
    id: 'elec-002',
    cat: 'Electricity',
    name: 'Building Management System (BMS)',
    costPerT: 85,
    maxTPerYear: 420
  },
  {
    id: 'elec-003',
    cat: 'Electricity',
    name: 'Solar PV Installation',
    costPerT: 120,
    maxTPerYear: 650
  },

  // Gas & Heating Category (3 interventions)
  {
    id: 'heat-001',
    cat: 'Gas/Heating',
    name: 'Building Fabric Improvements',
    costPerT: 65,
    maxTPerYear: 380
  },
  {
    id: 'heat-002',
    cat: 'Gas/Heating',
    name: 'Heating Controls Upgrade',
    costPerT: 35,
    maxTPerYear: 180
  },
  {
    id: 'heat-003',
    cat: 'Gas/Heating',
    name: 'Heat Pump Pilot Project',
    costPerT: 160,
    maxTPerYear: 900
  },

  // Water Category (3 interventions)
  {
    id: 'water-001',
    cat: 'Water',
    name: 'Low-Flow Fixtures',
    costPerT: 55,
    maxTPerYear: 150
  },
  {
    id: 'water-002',
    cat: 'Water',
    name: 'Rainwater Harvesting',
    costPerT: 95,
    maxTPerYear: 220
  },
  {
    id: 'water-003',
    cat: 'Water',
    name: 'Smart Water Meters',
    costPerT: 70,
    maxTPerYear: 180
  },

  // Waste Category (3 interventions)
  {
    id: 'waste-001',
    cat: 'Waste',
    name: 'Waste Segregation Program',
    costPerT: 25,
    maxTPerYear: 300
  },
  {
    id: 'waste-002',
    cat: 'Waste',
    name: 'Food Waste Reduction',
    costPerT: 40,
    maxTPerYear: 200
  },
  {
    id: 'waste-003',
    cat: 'Waste',
    name: 'Circular Economy Initiative',
    costPerT: 80,
    maxTPerYear: 350
  },

  // Travel Category (3 interventions)
  {
    id: 'travel-001',
    cat: 'Travel',
    name: 'Video Conferencing Systems',
    costPerT: 50,
    maxTPerYear: 450
  },
  {
    id: 'travel-002',
    cat: 'Travel',
    name: 'Electric Vehicle Fleet',
    costPerT: 140,
    maxTPerYear: 600
  },
  {
    id: 'travel-003',
    cat: 'Travel',
    name: 'Public Transport Incentives',
    costPerT: 30,
    maxTPerYear: 280
  }
];

// Helper functions for working with the catalog
export const getInterventionsByCategory = (category: Category) => 
  interventionsCatalog.filter(intervention => intervention.cat === category);

export const getInterventionById = (id: string) => 
  interventionsCatalog.find(intervention => intervention.id === id);

export const getTotalMaxReduction = () => 
  interventionsCatalog.reduce((total, intervention) => total + intervention.maxTPerYear, 0);

export const getAverageCostPerT = () => {
  const totalCost = interventionsCatalog.reduce((total, intervention) => 
    total + (intervention.costPerT * intervention.maxTPerYear), 0);
  const totalReduction = getTotalMaxReduction();
  return totalCost / totalReduction;
};

export default interventionsCatalog;