import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { useBudget } from '../store/budgetStore';
import { interventionsCatalog } from '../mock/catalog';
import { calculateInterventionAbatement, formatCurrency } from '../utils/compute';
import type { AllocationRow } from '../types';

/**
 * MACC (Marginal Abatement Cost Curve) Chart
 * Professional cost-effectiveness visualization
 */
const MACC: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { state } = useBudget();

  // Calculate funded interventions
  const fundedRows = useMemo((): AllocationRow[] => {
    try {
      const rows: AllocationRow[] = [];
      
      interventionsCatalog.forEach(intervention => {
        const spend = state.allocations[intervention.id] || 0;
        if (spend > 0) {
          const abatement = calculateInterventionAbatement(intervention, spend);
          rows.push({
            cat: intervention.cat,
            interventionId: intervention.id,
            spend,
            abatement,
            costPerT: intervention.costPerT,
          });
        }
      });

      return rows.sort((a, b) => a.costPerT - b.costPerT);
    } catch (error) {
      console.error('Error calculating funded rows for MACC:', error);
      return [];
    }
  }, [state.allocations]);

  // Color scale for categories
  const colorScale = useMemo(() => {
    return d3.scaleOrdinal()
      .domain(['Electricity', 'Gas/Heating', 'Water', 'Waste', 'Travel'])
      .range(['#3b82f6', '#ef4444', '#06b6d4', '#10b981', '#8b5cf6']);
  }, []);

  const showTooltip = useCallback((event: MouseEvent, d: AllocationRow) => {
    if (!tooltipRef.current) return;

    const intervention = interventionsCatalog.find(i => i.id === d.interventionId);
    
    tooltipRef.current.style.display = 'block';
    tooltipRef.current.style.left = `${event.pageX + 10}px`;
    tooltipRef.current.style.top = `${event.pageY - 10}px`;
    tooltipRef.current.style.opacity = '1';
    tooltipRef.current.innerHTML = `
      <div style="font-weight: 600; color: white; margin-bottom: 4px;">${intervention?.name || 'Unknown'}</div>
      <div style="font-size: 12px; color: #d1d5db;">
        <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 2px;">
          <span>Category:</span><span style="font-weight: 500;">${d.cat}</span>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 2px;">
          <span>Cost/tonne:</span><span style="font-weight: 500;">${formatCurrency(d.costPerT)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 2px;">
          <span>Investment:</span><span style="font-weight: 500;">${formatCurrency(d.spend)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 16px;">
          <span>Abatement:</span><span style="font-weight: 500;">${d.abatement.toFixed(1)} tCO₂e</span>
        </div>
      </div>
    `;
  }, []);

  const hideTooltip = useCallback(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
    }
  }, []);

  const drawChart = useCallback(() => {
    if (!svgRef.current || fundedRows.length === 0) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 30, right: 40, bottom: 70, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(fundedRows.map((_, i) => i.toString()))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(fundedRows, d => d.costPerT) || 100])
      .range([height, 0]);

    // Bars
    g.selectAll('.bar')
      .data(fundedRows)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (_, i) => xScale(i.toString())!)
      .attr('y', d => yScale(d.costPerT))
      .attr('width', xScale.bandwidth())
      .attr('height', d => height - yScale(d.costPerT))
      .attr('fill', d => colorScale(d.cat) as string)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 0.8);
        showTooltip(event, d);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        hideTooltip();
      });

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(() => ''))
      .selectAll('text')
      .style('fill', '#6b7280')
      .style('font-size', '12px');

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `£${d}`))
      .selectAll('text')
      .style('fill', '#6b7280')
      .style('font-size', '12px');

    // Labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', '#4b5563')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .text('Cost per tCO₂e (£)');

  }, [fundedRows, colorScale, showTooltip, hideTooltip]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  if (fundedRows.length === 0) {
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
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)'
        }}></div>
        
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              border: '1px solid #F59E0B'
            }}>💰</div>
            <div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#111827',
                margin: 0,
                lineHeight: '1.1'
              }}>Cost Effectiveness</h3>
              <p style={{
                fontSize: '10px',
                color: '#6B7280',
                margin: 0,
                fontWeight: '500'
              }}>Investment efficiency</p>
            </div>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          color: '#9CA3AF'
        }}>
          <div style={{ textAlign: 'center' as const }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
            <p style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#6B7280',
              margin: 0
            }}>No funded interventions yet</p>
          </div>
        </div>
      </div>
    );
  }

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
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '4px',
        background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)'
      }}></div>
      
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            border: '1px solid #F59E0B'
          }}>💰</div>
          <div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '700',
              color: '#111827',
              margin: 0,
              lineHeight: '1.1'
            }}>Cost Effectiveness</h3>
            <p style={{
              fontSize: '10px',
              color: '#6B7280',
              margin: 0,
              fontWeight: '500'
            }}>MACC Analysis</p>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1 }}>
        <svg 
          ref={svgRef} 
          style={{
            width: '100%',
            height: '100%',
            minHeight: '140px',
            border: '1px solid rgba(229,231,235,0.4)',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.5)'
          }}
        />
        <div 
          ref={tooltipRef}
          style={{
            position: 'absolute',
            zIndex: 10,
            background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
            color: 'white',
            fontSize: '12px',
            borderRadius: '8px',
            padding: '8px 12px',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'none'
          }}
        ></div>
      </div>
    </div>
  );
};

export default MACC;