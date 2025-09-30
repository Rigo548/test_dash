import TopInputs from './components/TopInputs';
import KPIs from './components/KPIs';
import CategoryCard from './components/CategoryCard';
import MACC from './charts/MACC';
import AbatementVsTarget from './charts/AbatementVsTarget';
import BudgetByCategory from './charts/BudgetByCategory';
import { Trajectory } from './charts/Trajectory';
import { BudgetProvider } from './store/budgetStore';
import { interventionsCatalog } from './mock/catalog';
import type { Category } from './types';

/**
 * Main application component - Carbon Budget Planning Dashboard
 * 
 * Provides a comprehensive interface for planning and analyzing carbon reduction portfolios.
 * Features interactive budget allocation, real-time KPI tracking, and visual analytics.
 */
function App() {
  // Get unique categories from the catalog
  const categories: Category[] = ['Electricity', 'Gas/Heating', 'Water', 'Waste', 'Travel'];
  
  // Group interventions by category
  const getInterventionsByCategory = (category: Category) => {
    return interventionsCatalog.filter(intervention => intervention.cat === category);
  };
  
  return (
    <BudgetProvider>
      <div style={{ 
        height: '100vh',
        display: 'grid', 
        gridTemplateColumns: '300px 1fr',
        gridTemplateRows: 'auto 1fr',
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
      }}>
        {/* Compact Header - Spans all three columns */}
        <div style={{
          gridColumn: '1 / -1',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderBottom: '2px solid #e5e7eb',
          padding: '8px 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: '800',
                color: '#eab308',
                margin: 0,
                lineHeight: '1.2'
              }}>Carbon Budget Dashboard</h1>
              <p style={{
                color: '#6b7280',
                margin: 0,
                fontSize: '12px',
                fontWeight: '500'
              }}>Monitor and optimize your carbon reduction portfolio</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>Portfolio Status</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#059669' }}>Active</div>
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(234,179,8,0.3)'
              }}>
                <span style={{ color: 'white', fontWeight: '700', fontSize: '12px' }}>CB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Left Sidebar - Budget Controls */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRight: '2px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column' as const,
          overflow: 'hidden',
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            padding: '12px',
            borderBottom: '1px solid #e5e7eb',
            background: 'rgba(255,255,255,0.8)'
          }}>
            <h3 style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#374151',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
              margin: '0 0 8px 0'
            }}>
              Budget Configuration
            </h3>
            <TopInputs />
          </div>
        </div>

        {/* Main Content Area - Charts */}
        <div style={{
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr',
          gap: '12px',
          padding: '12px',
          overflow: 'hidden'
        }}>
          {/* KPIs Section - Compact */}
          <div style={{ minHeight: '120px' }}>
            <KPIs />
          </div>
          
          {/* Intervention Categories - Horizontal Layout */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '12px',
            border: '2px solid #e5e7eb',
            padding: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#374151',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
              margin: '0 0 8px 0'
            }}>
              Intervention Categories
            </h3>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '8px'
            }}>
              {categories.map((category) => (
                <CategoryCard 
                  key={category} 
                  cat={category} 
                  interventions={getInterventionsByCategory(category)} 
                />
              ))}
            </div>
          </div>
          
          {/* Charts Grid - Compact layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: 'auto auto',
            gap: '10px',
            minHeight: 0
          }}>
            {/* Top row - MACC spanning both columns */}
            <div style={{ gridColumn: '1 / -1', minHeight: '160px' }}>
              <MACC />
            </div>
            
            {/* Bottom row - Two charts side by side */}
            <div style={{ minHeight: '140px' }}>
              <AbatementVsTarget />
            </div>
            <div style={{ minHeight: '140px' }}>
              <BudgetByCategory />
            </div>
            
            {/* Trajectory Chart - Bottom spanning both columns */}
            <div style={{ gridColumn: '1 / -1', minHeight: '120px' }}>
              <Trajectory />
            </div>
          </div>
        </div>


      </div>
    </BudgetProvider>
  );
}

export default App;
