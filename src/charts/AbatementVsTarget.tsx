import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useBudget } from '../store/budgetStore';
import { interventionsCatalog } from '../mock/catalog';
import { formatTonnes, computePortfolioMetrics } from '../utils/compute';

/**
 * Abatement vs Target Progress Chart
 * 
 * Horizontal progress bar showing current portfolio abatement against annual target.
 * Green bar: Current projected abatement from all funded interventions
 * Target line: Annual carbon reduction goal
 * Gap badge: Remaining abatement needed (if any)
 * 
 * Provides instant visual feedback on target progress and remaining gaps.
 */
const AbatementVsTarget: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { state } = useBudget();

  useEffect(() => {
    if (!svgRef.current) return;

    // Calculate portfolio metrics
    const { portfolioAbatement } = computePortfolioMetrics(
      interventionsCatalog,
      state.allocations,
      state.totalBudget,
      state.targetT
    );

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Chart dimensions
    const containerWidth = svgRef.current.clientWidth;
    const containerHeight = 120;
    const margin = { top: 20, right: 20, bottom: 40, left: 80 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Set SVG dimensions
    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Determine scale based on max value
    const maxValue = Math.max(portfolioAbatement, state.targetT, 100); // Minimum scale of 100
    const scale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, width]);

    // Bar height
    const barHeight = 30;
    const barY = (height - barHeight) / 2;

    // Draw background track
    g.append('rect')
      .attr('x', 0)
      .attr('y', barY)
      .attr('width', width)
      .attr('height', barHeight)
      .attr('fill', '#f3f4f6')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('rx', 4);

    // Draw planned abatement bar
    if (portfolioAbatement > 0) {
      g.append('rect')
        .attr('x', 0)
        .attr('y', barY)
        .attr('width', scale(portfolioAbatement))
        .attr('height', barHeight)
        .attr('fill', portfolioAbatement >= state.targetT ? '#10b981' : '#3b82f6')
        .attr('rx', 4)
        .style('transition', 'all 0.3s ease');
    }

    // Draw target marker line
    const targetX = scale(state.targetT);
    g.append('line')
      .attr('x1', targetX)
      .attr('x2', targetX)
      .attr('y1', barY - 10)
      .attr('y2', barY + barHeight + 10)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '4,2');

    // Target marker triangle
    g.append('polygon')
      .attr('points', `${targetX-5},${barY-10} ${targetX+5},${barY-10} ${targetX},${barY-5}`)
      .attr('fill', '#ef4444');

    // Add value labels
    // Planned abatement label
    if (portfolioAbatement > 0) {
      g.append('text')
        .attr('x', scale(portfolioAbatement) / 2)
        .attr('y', barY + barHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('fill', 'white')
        .text(`${portfolioAbatement.toFixed(0)} tCO₂e`);
    }

    // Target label
    g.append('text')
      .attr('x', targetX)
      .attr('y', barY - 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#ef4444')
      .text(`Target: ${formatTonnes(state.targetT).replace(' tCO₂e', '')}`);

    // Planned label (if there's space)
    if (portfolioAbatement > 0) {
      const plannedLabelX = Math.min(scale(portfolioAbatement) + 10, width - 60);
      g.append('text')
        .attr('x', plannedLabelX)
        .attr('y', barY + barHeight + 20)
        .attr('text-anchor', 'start')
        .style('font-size', '11px')
        .style('font-weight', '500')
        .style('fill', '#6b7280')
        .text(`Planned: ${portfolioAbatement.toFixed(0)} tCO₂e`);
    }

    // Add scale ticks
    const tickValues = [0, Math.round(maxValue * 0.25), Math.round(maxValue * 0.5), Math.round(maxValue * 0.75), Math.round(maxValue)];
    
    g.selectAll('.tick')
      .data(tickValues)
      .enter()
      .append('g')
      .attr('class', 'tick')
      .attr('transform', d => `translate(${scale(d)}, ${barY + barHeight + 5})`)
      .each(function(d) {
        const tick = d3.select(this);
        
        // Tick line
        tick.append('line')
          .attr('y1', 0)
          .attr('y2', 5)
          .attr('stroke', '#9ca3af')
          .attr('stroke-width', 1);
        
        // Tick label
        tick.append('text')
          .attr('y', 15)
          .attr('text-anchor', 'middle')
          .style('font-size', '9px')
          .style('fill', '#6b7280')
          .text(d.toLocaleString());
      });

  }, [state.allocations, state.targetT, state.totalBudget]);

  // Calculate gap for badge
  const { portfolioAbatement } = computePortfolioMetrics(
    interventionsCatalog,
    state.allocations,
    state.totalBudget,
    state.targetT
  );
  
  const gap = Math.max(0, state.targetT - portfolioAbatement);
  const isTargetMet = portfolioAbatement >= state.targetT;
  const completionPercentage = state.targetT > 0 ? (portfolioAbatement / state.targetT) * 100 : 0;

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
        background: 'linear-gradient(90deg, #3B82F6 0%, #1E40AF 100%)'
      }}></div>
      
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            border: '1px solid #3B82F6'
          }}>🎯</div>
          <div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '700',
              color: '#111827',
              margin: 0,
              lineHeight: '1.1'
            }}>Target Achievement</h3>
            <p style={{
              fontSize: '10px',
              color: '#6B7280',
              margin: 0,
              fontWeight: '500'
            }}>Progress vs target</p>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: '700',
          background: isTargetMet 
            ? 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)' 
            : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          color: isTargetMet ? '#065F46' : '#92400E',
          border: `1px solid ${isTargetMet ? '#6EE7B7' : '#FBBF24'}`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
        }}>
          {isTargetMet ? (
            <>
              <span style={{ marginRight: '3px', fontSize: '8px' }}>✅</span>
              Target Met!
            </>
          ) : (
            <>
              <span style={{ marginRight: '3px', fontSize: '8px' }}>⚠️</span>
              Gap: {gap.toFixed(0)} tCO₂e
            </>
          )}
        </div>
        
        <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '500' }}>
          <span style={{ fontWeight: '700' }}>{completionPercentage.toFixed(1)}%</span> achieved
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ position: 'relative', width: '100%', height: '80px', flex: 1 }}>
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ overflow: 'visible' }}
        />
      </div>

      {/* Legend */}
      <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', color: '#6b7280' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <div style={{ width: '10px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
          <span>Planned</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <div style={{ width: '10px', height: '6px', border: '1px dashed #ef4444', borderRadius: '2px', backgroundColor: 'transparent' }}></div>
          <span>Target</span>
        </div>
        {isTargetMet && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <div style={{ width: '10px', height: '8px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
            <span>Exceeded</span>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div style={{ 
        marginTop: '6px', 
        paddingTop: '6px', 
        borderTop: '1px solid #e5e7eb', 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '8px', 
        fontSize: '10px' 
      }}>
        <div>
          <span style={{ color: '#6b7280' }}>Planned:</span>
          <span style={{ marginLeft: '4px', fontWeight: '600', color: '#111827' }}>
            {portfolioAbatement.toFixed(1)} tCO₂e
          </span>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>Target:</span>
          <span style={{ marginLeft: '4px', fontWeight: '600', color: '#111827' }}>
            {state.targetT.toLocaleString()} tCO₂e
          </span>
        </div>
      </div>
    </div>
  );
};

export default AbatementVsTarget;