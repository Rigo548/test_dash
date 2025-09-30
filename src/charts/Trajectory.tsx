import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { useBudget } from '../store/budgetStore';
import { interventionsCatalog } from '../mock/catalog';
import { calculateInterventionAbatement, formatCurrency, formatTonnes } from '../utils/compute';

/**
 * Multi-Year Trajectory Chart
 * 
 * Dual-axis visualization showing 5-year projection of spending and abatement.
 * Green bars: Annual spending (Y1 = current portfolio, Y2-Y5 = future budgets)
 * Red line: Projected annual abatement using current intervention mix proportions
 * 
 * EXTENSION POINT: Replace simple proportion projection with sophisticated 
 * 5-year phasing model that accounts for implementation curves, technology 
 * adoption rates, and diminishing returns over time.
 */
export const Trajectory: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { state } = useBudget();
  
  // Memoize trajectory data calculations
  const trajectoryData = useMemo(() => {
    try {
      // Calculate current portfolio spend for Y1
      let currentPortfolioSpend = 0;
      interventionsCatalog.forEach(intervention => {
        const spend = state.allocations[intervention.id] || 0;
        currentPortfolioSpend += spend;
      });

      // Build projection array [Y1...Y5]
      const yearlySpend = [currentPortfolioSpend, ...state.futureBudgets];
      
      // Calculate current intervention mix (as proportions)
      const currentInterventionMix: Record<string, number> = {};
      if (currentPortfolioSpend > 0) {
        interventionsCatalog.forEach(intervention => {
          const spend = state.allocations[intervention.id] || 0;
          currentInterventionMix[intervention.id] = spend / currentPortfolioSpend;
        });
      }

      // Project abatement for each year using the same mix
      const projectedAbatement = yearlySpend.map(totalBudget => {
        if (totalBudget === 0) return 0;
        
        let yearAbatement = 0;
        interventionsCatalog.forEach(intervention => {
          const proportion = currentInterventionMix[intervention.id] || 0;
          const projectedSpend = totalBudget * proportion;
          yearAbatement += calculateInterventionAbatement(intervention, projectedSpend);
        });
        
        return yearAbatement;
      });

      return {
        yearlySpend,
        projectedAbatement,
        currentPortfolioSpend,
        allFutureBudgetsZero: state.futureBudgets.every(budget => budget === 0)
      };
    } catch (error) {
      console.error('Error calculating trajectory data:', error);
      return {
        yearlySpend: [0, 0, 0, 0, 0],
        projectedAbatement: [0, 0, 0, 0, 0],
        currentPortfolioSpend: 0,
        allFutureBudgetsZero: true
      };
    }
  }, [state.allocations, state.futureBudgets]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).selectAll('*').remove();
    }
  }, []);
  
  useEffect(() => {
    if (!svgRef.current) return;

    cleanup();
    
    try {
      const svg = d3.select(svgRef.current);
      
      if (trajectoryData.allFutureBudgetsZero) {
        // Render empty state
        svg
          .append('text')
          .attr('x', 300)
          .attr('y', 150)
          .attr('text-anchor', 'middle')
          .attr('class', 'text-sm fill-gray-500')
          .text('Enter Year 2–5 £ to see projection');
        return;
      }

      const { yearlySpend, projectedAbatement } = trajectoryData;

    // Chart dimensions
    const margin = { top: 20, right: 80, bottom: 50, left: 80 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.bottom - margin.top;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(['Y1', 'Y2', 'Y3', 'Y4', 'Y5'])
      .range([0, width])
      .padding(0.3);

    const ySpendScale = d3
      .scaleLinear()
      .domain([0, d3.max(yearlySpend) || 0])
      .range([height, 0]);

    const yAbatementScale = d3
      .scaleLinear()
      .domain([0, d3.max(projectedAbatement) || 0])
      .range([height, 0]);

    // Draw bars (spending)
    g.selectAll('.spend-bar')
      .data(yearlySpend)
      .enter()
      .append('rect')
      .attr('class', 'spend-bar')
      .attr('x', (_, i) => xScale(['Y1', 'Y2', 'Y3', 'Y4', 'Y5'][i])!)
      .attr('y', d => ySpendScale(d))
      .attr('width', xScale.bandwidth())
      .attr('height', d => height - ySpendScale(d))
      .attr('fill', '#10b981')
      .attr('opacity', 0.7);

    // Draw line (abatement)
    const line = d3
      .line<number>()
      .x((_, i) => xScale(['Y1', 'Y2', 'Y3', 'Y4', 'Y5'][i])! + xScale.bandwidth() / 2)
      .y(d => yAbatementScale(d))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(projectedAbatement)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Draw dots on line
    g.selectAll('.abatement-dot')
      .data(projectedAbatement)
      .enter()
      .append('circle')
      .attr('class', 'abatement-dot')
      .attr('cx', (_, i) => xScale(['Y1', 'Y2', 'Y3', 'Y4', 'Y5'][i])! + xScale.bandwidth() / 2)
      .attr('cy', d => yAbatementScale(d))
      .attr('r', 4)
      .attr('fill', '#ef4444');

    // X-axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('class', 'fill-gray-600 text-xs');

    // Left Y-axis (spending)
    g.append('g')
      .call(d3.axisLeft(ySpendScale).tickFormat(d => formatCurrency(d as number)))
      .selectAll('text')
      .attr('class', 'fill-gray-600 text-xs');

    // Right Y-axis (abatement)
    g.append('g')
      .attr('transform', `translate(${width},0)`)
      .call(d3.axisRight(yAbatementScale).tickFormat(d => formatTonnes(d as number)))
      .selectAll('text')
      .attr('class', 'fill-gray-600 text-xs');

    // Left axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .attr('text-anchor', 'middle')
      .attr('class', 'fill-gray-700 text-sm font-medium')
      .text('Annual Spend (£)');

    // Right axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', width + margin.right - 10)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .attr('text-anchor', 'middle')
      .attr('class', 'fill-gray-700 text-sm font-medium')
      .text('Annual Abatement (tCO₂e)');

    // Legend
    const legend = g.append('g')
      .attr('transform', `translate(${width - 120}, 20)`);

    // Spending legend
    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', '#10b981')
      .attr('opacity', 0.7);

    legend.append('text')
      .attr('x', 18)
      .attr('y', 9)
      .attr('class', 'fill-gray-700 text-xs')
      .text('Spend');

    // Abatement legend
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 25)
      .attr('x2', 12)
      .attr('y2', 25)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2);

    legend.append('circle')
      .attr('cx', 6)
      .attr('cy', 25)
      .attr('r', 2)
      .attr('fill', '#ef4444');

    legend.append('text')
      .attr('x', 18)
      .attr('y', 29)
      .attr('class', 'fill-gray-700 text-xs')
      .text('Abatement');

    // Add tooltip functionality
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'absolute bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none opacity-0')
      .style('z-index', '1000');

    // Add tooltip to bars
    g.selectAll('.spend-bar')
      .on('mouseover', function(event, d) {
        const yearIndex = yearlySpend.indexOf(d as number);
        const year = ['Y1', 'Y2', 'Y3', 'Y4', 'Y5'][yearIndex];
        
        tooltip
          .style('opacity', 1)
          .html(`${year}<br/>Spend: ${formatCurrency(d as number)}<br/>Abatement: ${formatTonnes(projectedAbatement[yearIndex])}`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
      });

    } catch (error) {
      console.error('Error rendering Trajectory chart:', error);
      const svg = d3.select(svgRef.current!);
      svg.append('text')
        .attr('x', 300)
        .attr('y', 150)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-sm fill-red-500')
        .text('Error loading trajectory chart');
    }

    return cleanup;
  }, [trajectoryData, cleanup]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.98) 100%)',
      border: '2px solid rgba(229,231,235,0.6)',
      borderRadius: '12px',
      padding: '12px',
      height: '100%',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      transition: 'all 0.3s ease',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      display: 'flex',
      flexDirection: 'column' as const
    }}>
      {/* Professional Card Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '4px',
        background: 'linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%)'
      }}></div>
      
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            border: '1px solid #8B5CF6'
          }}>📈</div>
          <div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '700',
              color: '#111827',
              margin: 0,
              lineHeight: '1.1'
            }}>5-Year Trajectory</h3>
            <p style={{
              fontSize: '10px',
              color: '#6B7280',
              margin: 0,
              fontWeight: '500'
            }}>Spending & abatement projection</p>
          </div>
        </div>
      </div>
      <svg 
        ref={svgRef} 
        width="600" 
        height="200" 
        style={{
          width: '100%',
          height: 'auto',
          border: '1px solid rgba(229,231,235,0.4)',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.5)',
          flex: 1
        }}
      ></svg>
    </div>
  );
};