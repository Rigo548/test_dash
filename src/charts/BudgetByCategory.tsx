import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { useBudget } from '../store/budgetStore';
import { interventionsCatalog } from '../mock/catalog';
import type { Category } from '../types';
import { formatCurrency } from '../utils/compute';

interface CategoryData {
  category: Category;
  spend: number;
  percentage: number;
  color: string;
}

/**
 * Budget by Category Composition Chart
 * 
 * Horizontal bar chart showing spending breakdown across intervention categories.
 * Each bar represents total spending within a category (Electricity, Gas, Water, etc.)
 * Bar length proportional to spending amount, with percentages and totals labeled.
 * 
 * Helps users understand portfolio balance and identify over/under-invested areas.
 */
const BudgetByCategory: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { state } = useBudget();

  // Memoized constants
  const categoryColors = useMemo(() => ({
    'Electricity': '#3b82f6',
    'Gas/Heating': '#ef4444',
    'Water': '#06b6d4',
    'Waste': '#10b981',
    'Travel': '#f59e0b',
  }), []);

  const categoryIcons = useMemo(() => ({
    'Electricity': '⚡',
    'Gas/Heating': '🔥',
    'Water': '💧',
    'Waste': '🗑️',
    'Travel': '✈️',
  }), []);

  // Memoized category data calculation
  const categoryData = useMemo((): CategoryData[] => {
    try {
      const categorySpending = new Map<Category, number>();
      
      interventionsCatalog.forEach(intervention => {
        const spend = state.allocations[intervention.id] || 0;
        const currentSpend = categorySpending.get(intervention.cat) || 0;
        categorySpending.set(intervention.cat, currentSpend + spend);
      });

      const totalSpend = Array.from(categorySpending.values()).reduce((sum, spend) => sum + spend, 0);
      
      return Array.from(categorySpending.entries())
        .filter(([, spend]) => spend > 0)
        .map(([category, spend]) => ({
          category,
          spend,
          percentage: totalSpend > 0 ? (spend / totalSpend) * 100 : 0,
          color: categoryColors[category],
        }))
        .sort((a, b) => b.spend - a.spend);
    } catch (error) {
      console.error('Error calculating category data:', error);
      return [];
    }
  }, [state.allocations, categoryColors]);

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

    if (categoryData.length === 0) {
      // Show empty state
      const svg = d3.select(svgRef.current);
      svg.append('text')
        .attr('x', '50%')
        .attr('y', '50%')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('class', 'fill-gray-400 text-sm')
        .text('No budget allocated yet');
      return;
    }

    // Chart dimensions
    const containerWidth = svgRef.current.clientWidth;
    const containerHeight = Math.max(200, categoryData.length * 40 + 60);
    const margin = { top: 20, right: 120, bottom: 20, left: 80 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Set SVG dimensions
    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(categoryData, d => d.spend) || 100])
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(categoryData.map(d => d.category))
      .range([0, height])
      .padding(0.2);

    // Create bars
    const bars = g.selectAll('.bar')
      .data(categoryData)
      .enter()
      .append('g')
      .attr('class', 'bar')
      .attr('transform', d => `translate(0, ${yScale(d.category)})`);

    // Bar backgrounds (light gray)
    bars.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', yScale.bandwidth())
      .attr('fill', '#f9fafb')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('rx', 4);

    // Actual bars
    bars.append('rect')
      .attr('x', 0)
      .attr('y', 2)
      .attr('width', 0)
      .attr('height', yScale.bandwidth() - 4)
      .attr('fill', d => d.color)
      .attr('rx', 3)
      .transition()
      .duration(500)
      .ease(d3.easeQuadOut)
      .attr('width', d => xScale(d.spend));

    // Category labels with icons
    bars.append('text')
      .attr('x', -10)
      .attr('y', yScale.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '500')
      .style('fill', '#374151')
      .text(d => `${categoryIcons[d.category]} ${d.category}`);

    // Value labels on bars (£ amount)
    bars.append('text')
      .attr('x', d => Math.max(xScale(d.spend) + 8, 40))
      .attr('y', yScale.bandwidth() / 2 - 2)
      .attr('dominant-baseline', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', '#111827')
      .text(d => formatCurrency(d.spend));

    // Percentage labels
    bars.append('text')
      .attr('x', d => Math.max(xScale(d.spend) + 8, 40))
      .attr('y', yScale.bandwidth() / 2 + 12)
      .attr('dominant-baseline', 'middle')
      .style('font-size', '10px')
      .style('font-weight', '500')
      .style('fill', '#6b7280')
      .text(d => `${d.percentage.toFixed(1)}%`);

    // Create X axis
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale)
        .ticks(5)
        .tickFormat(d => `£${d3.format('.0s')(d as number)}`));

    // Add X axis label
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 35)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .text('Budget Allocation (£)');

    // Add total spending summary
    g.append('text')
      .attr('x', width)
      .attr('y', -5)
      .attr('text-anchor', 'end')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .text(`Total: £${categoryData.reduce((sum, d) => sum + d.spend, 0).toLocaleString()}`);

    } catch (error) {
      console.error('Error rendering BudgetByCategory chart:', error);
      const svg = d3.select(svgRef.current!);
      svg.append('text')
        .attr('x', '50%')
        .attr('y', '50%')
        .attr('text-anchor', 'middle')
        .attr('class', 'fill-red-400 text-sm')
        .text('Error loading chart');
    }

    return cleanup;
  }, [categoryData, categoryIcons, cleanup]);

  // Use memoized category data for display
  const totalSpend = categoryData.reduce((sum, d) => sum + d.spend, 0);  return (
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
        background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
      }}></div>
      
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            border: '1px solid #10B981'
          }}>📊</div>
          <div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '700',
              color: '#111827',
              margin: 0,
              lineHeight: '1.1'
            }}>Portfolio Allocation</h3>
            <p style={{
              fontSize: '10px',
              color: '#6B7280',
              margin: 0,
              fontWeight: '500'
            }}>Budget by category</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ 
        marginBottom: '8px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '8px',
        background: 'rgba(255,255,255,0.6)',
        borderRadius: '8px',
        border: '1px solid rgba(229,231,235,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: '500' }}>Total:</span>
            <span style={{ 
              marginLeft: '4px', 
              fontWeight: '700', 
              color: '#111827',
              fontSize: '11px'
            }}>
              £{totalSpend.toLocaleString()}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: '500' }}>Categories:</span>
            <span style={{ 
              marginLeft: '4px', 
              fontWeight: '700', 
              color: '#111827',
              fontSize: '11px'
            }}>
              {categoryData.filter(d => d.spend > 0).length}
            </span>
          </div>
        </div>
        <div>
          <div style={{
            fontSize: '12px',
            color: '#9CA3AF',
            fontWeight: '600',
            padding: '4px 12px',
            background: totalSpend === 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            borderRadius: '12px',
            border: `1px solid ${totalSpend === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`
          }}>
            {totalSpend === 0 ? 'No budget allocated' : 'Budget distributed'}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ position: 'relative', width: '100%', flex: 1 }}>
        <svg
          ref={svgRef}
          style={{ width: '100%', overflow: 'visible', minHeight: '120px' }}
        />
      </div>

      {/* Legend/Key */}
      {totalSpend > 0 && (
        <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '9px' }}>
            {categoryData.map(({ category, spend, color }) => {
              if (spend === 0) return null;
              
              return (
                <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <div 
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '2px', 
                      backgroundColor: color 
                    }}
                  />
                  <span style={{ color: '#6b7280' }}>
                    {categoryIcons[category as Category]} {category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetByCategory;