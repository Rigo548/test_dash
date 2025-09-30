# Green Budget - Carbon Reduction Portfolio Manager# React + TypeScript + Vite



A React-based dashboard for planning and tracking carbon reduction interventions with intelligent budget allocation and real-time analytics.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## 🚀 Quick StartCurrently, two official plugins are available:



```bash- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh

npm install- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

npm run dev

```## React Compiler



Open [http://localhost:5173](http://localhost:5173) to view the dashboard.The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).



## 📋 10-Minute Developer Onboarding## Expanding the ESLint configuration



### Architecture OverviewIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:



``````js

src/export default defineConfig([

├── components/          # UI components  globalIgnores(['dist']),

│   ├── TopInputs.tsx   # Budget controls & future year planning  {

│   ├── CategoryCard.tsx # Manual intervention entry + ROI distribution    files: ['**/*.{ts,tsx}'],

│   └── KPIs.tsx        # Live portfolio analytics    extends: [

├── charts/             # D3 visualizations      // Other configs...

│   ├── MACC.tsx        # Cost-effectiveness bar chart

│   ├── AbatementVsTarget.tsx # Progress visualization      // Remove tseslint.configs.recommended and replace with this

│   ├── BudgetByCategory.tsx  # Spending composition      tseslint.configs.recommendedTypeChecked,

│   └── Trajectory.tsx  # 5-year projection (EXTENSION POINT)      // Alternatively, use this for stricter rules

├── store/              # State management      tseslint.configs.strictTypeChecked,

│   └── budgetStore.tsx # React useReducer store      // Optionally, add this for stylistic rules

├── utils/              # Business logic      tseslint.configs.stylisticTypeChecked,

│   └── compute.ts      # Portfolio calculations & formatting

├── mock/               # Sample data      // Other configs...

│   └── catalog.ts      # 15 realistic interventions    ],

└── types/              # TypeScript definitions    languageOptions: {

    └── index.ts        # Core data models      parserOptions: {

```        project: ['./tsconfig.node.json', './tsconfig.app.json'],

        tsconfigRootDir: import.meta.dirname,

### Core Philosophy      },

      // other options...

#### 1. **Single-Year Slider + Annual Target**    },

- **Budget Slider**: Set total available budget for Year 1 planning  },

- **Annual Target**: Carbon reduction goal (tCO₂e/year) for this budget cycle])

- **Philosophy**: Focus on immediate, actionable annual planning rather than abstract multi-year commitments```

- **Why**: Enables precise resource allocation with clear accountability periods

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

#### 2. **Manual-First Category Cards**

- **Manual Entry**: Users directly input spending amounts (£10k increments) per intervention```js

- **Live Calculations**: Real-time abatement calculation based on `spend / costPerT` (capped at `maxTPerYear`)// eslint.config.js

- **ROI Distribution**: "Smart fill" button auto-allocates remaining budget by cost-effectivenessimport reactX from 'eslint-plugin-react-x'

- **Philosophy**: Human insight drives allocation; automation assists but never overridesimport reactDom from 'eslint-plugin-react-dom'

- **Why**: Combines domain expertise with algorithmic efficiency

export default defineConfig([

### What Each Chart Shows  globalIgnores(['dist']),

  {

#### 📊 **MACC (Marginal Abatement Cost Curve)**    files: ['**/*.{ts,tsx}'],

- **Purpose**: Cost-effectiveness ranking of funded interventions    extends: [

- **Visual**: Vertical bars sorted by £/tCO₂e (cheapest first)      // Other configs...

- **Insight**: Identifies best value investments and optimization opportunities      // Enable lint rules for React

      reactX.configs['recommended-typescript'],

#### 🎯 **Abatement vs Target**      // Enable lint rules for React DOM

- **Purpose**: Progress towards annual carbon reduction goal      reactDom.configs.recommended,

- **Visual**: Horizontal progress bar with target line and gap indicator    ],

- **Insight**: Instant feedback on target achievement and funding adequacy    languageOptions: {

      parserOptions: {

#### 📈 **Budget by Category**        project: ['./tsconfig.node.json', './tsconfig.app.json'],

- **Purpose**: Portfolio balance across intervention types        tsconfigRootDir: import.meta.dirname,

- **Visual**: Horizontal bars showing spending distribution (Electricity, Gas, Water, etc.)      },

- **Insight**: Prevents over-concentration and reveals investment patterns      // other options...

    },

#### 📅 **Multi-Year Trajectory**  },

- **Purpose**: 5-year spending and abatement projection])

- **Visual**: Dual-axis chart (bars = spend, line = abatement)```

- **Current Logic**: Simple proportion scaling using Year 1 intervention mix
- **⚠️ EXTENSION POINT**: Replace with sophisticated phasing model (see below)

## 🔧 Key Extension Points

### 1. **Replace Simple Projection Logic** 📍
**Location**: `src/charts/Trajectory.tsx` lines 35-45

**Current**: Scales Year 1 intervention mix proportionally across Years 2-5
```typescript
// Current simple projection
const projectedAbatement = yearlySpend.map(totalBudget => {
  let yearAbatement = 0;
  interventionsCatalog.forEach(intervention => {
    const proportion = currentInterventionMix[intervention.id] || 0;
    const projectedSpend = totalBudget * proportion;
    yearAbatement += calculateInterventionAbatement(intervention, projectedSpend);
  });
  return yearAbatement;
});
```

**Replace With**: Sophisticated 5-year phasing model considering:
- Implementation curves (ramp-up periods)
- Technology adoption rates
- Diminishing returns over time
- Policy dependency scheduling
- Capital vs operational expenditure patterns

### 2. **Enhanced ROI Algorithm**
**Location**: `src/components/CategoryCard.tsx` lines 79-112

**Current**: Simple cost-per-tonne sorting
**Future**: Multi-criteria optimization including risk, timing, co-benefits

### 3. **Advanced Portfolio Analytics**
**Location**: `src/utils/compute.ts`

**Current**: Basic metrics (spend, abatement, efficiency)
**Future**: Risk assessment, scenario modeling, sensitivity analysis

## 🎨 User Experience Design

### Humane Features
- **Smart Formatting**: £1.5M instead of £1,500,000
- **Helpful Hints**: Zero budget guidance, overspend warnings
- **Preserve Control**: ROI suggestions never overwrite manual entries
- **Reset Functionality**: Clear allocations while preserving budget settings

### Interactive Flow
1. **Set Budget**: Use top slider to define available funds
2. **Manual Allocation**: Enter spending per intervention in category cards
3. **Smart Fill**: Use ROI buttons to fill remaining gaps intelligently  
4. **Real-Time Feedback**: Watch KPIs and charts update automatically
5. **Multi-Year Planning**: Set Years 2-5 budgets to see trajectory

## 📊 Data Models

### Core Types
```typescript
interface Intervention {
  id: string;
  cat: Category;           // Electricity|Gas/Heating|Water|Waste|Travel
  name: string;
  costPerT: number;        // £/tCO₂e
  maxTPerYear: number;     // Annual abatement ceiling
}

interface BudgetState {
  totalBudget: number;     // Year 1 budget (£)
  targetT: number;         // Annual target (tCO₂e)
  futureBudgets: number[]; // Years 2-5 budgets
  allocations: Record<string, number>; // interventionId -> spend
}
```

### Business Logic
```typescript
// Abatement calculation (with ceiling)
const abatement = Math.min(
  intervention.maxTPerYear,
  spend / intervention.costPerT
);

// Cost-effectiveness ranking
interventions.sort((a, b) => a.costPerT - b.costPerT);
```

## 🏗️ Development

### Tech Stack
- **React 19** + **TypeScript** for type-safe UI
- **Vite** for fast development and building  
- **TailwindCSS** for utility-first styling
- **D3.js** for interactive data visualizations
- **React useReducer** for predictable state management

### Code Quality
- **JSDoc**: All functions documented with purpose, parameters, and returns
- **TypeScript Strict**: Full type coverage with no `any` types
- **Consistent Formatting**: Smart number formatting across all components
- **Error Boundaries**: Graceful handling of edge cases

### Testing
```bash
npm run build    # Production build
npm run preview  # Preview production build
```

## 🤝 Contributing

### Adding New Interventions
Edit `src/mock/catalog.ts` to add interventions:
```typescript
{
  id: 'elec-004',
  cat: 'Electricity',
  name: 'Solar PV Installation', 
  costPerT: 75,
  maxTPerYear: 180
}
```

### Adding New Categories
1. Update `Category` type in `src/types/index.ts`
2. Add icon in `CategoryCard.getCategoryIcon()`
3. Include in category list in `src/App.tsx`

### Performance Optimization
- Charts re-render only on state changes (React.memo candidates)
- D3 selections cleared on unmount to prevent memory leaks
- Calculations cached within render cycles

---

**🎯 Goal**: Enable teams to plan carbon reduction portfolios with confidence, combining human insight with algorithmic assistance for maximum impact per pound invested.