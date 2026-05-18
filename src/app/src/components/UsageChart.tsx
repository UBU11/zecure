import React, { useCallback, useMemo } from 'react';
import { AreaClosed, LinePath, Bar } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { ParentSize } from '@visx/responsive';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { motion } from 'motion/react';

interface DataPoint {
  label: string;
  value: number;
}

interface UsageChartProps {
  data: DataPoint[];
  title: string;
  subTitle?: string;
  type?: string;
}

const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: '#ffffff',
  border: '4px solid #0f172a',
  color: '#0f172a',
  fontSize: '14px',
  fontWeight: 'bold',
  boxShadow: '4px 4px 0px 0px rgba(15,23,42,1)',
  borderRadius: '0px',
  padding: '12px',
};

const UsageChart: React.FC<UsageChartProps> = ({ data, title, subTitle, type }) => {
  const safeData = useMemo(() => data.filter(d => isFinite(d.value) && !isNaN(d.value)), [data]);
  
  const {
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
  } = useTooltip<DataPoint>();

  if (safeData.length === 0) {
    return (
      <div className="neo-box neo-shadow p-6 min-h-[400px] flex items-center justify-center">
        <p className="font-bold text-slate-400 uppercase tracking-widest">No data available</p>
      </div>
    );
  }

  const isHourly = safeData[0]?.label.includes(':');

  return (
    <div className="neo-box neo-shadow p-6 flex flex-col h-[400px]">
      <div className="mb-4">
        {title && <h2 className="text-2xl neo-title mb-1">{title}</h2>}
        {subTitle && <p className="text-slate-600 font-bold uppercase text-xs tracking-wider">{subTitle}</p>}
      </div>
      
      <div className="flex-1 relative mt-2 border-4 border-slate-900 bg-white">
        <ParentSize>
          {({ width, height }) => {
            if (width < 10 || height < 10) return null;

            const margin = { top: 20, right: 20, bottom: 40, left: 50 };
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;

            // X Scale
            const xScale = scaleBand<string>({
              range: [0, innerWidth],
              domain: safeData.map(d => d.label),
              padding: 0.2,
            });

            // Y Scale: Dynamically find max to make updates visible
            const maxY = Math.max(...safeData.map(d => d.value), 0.1); 
            const yScale = scaleLinear<number>({
              range: [innerHeight, 0],
              domain: [0, maxY * 1.2], // 20% padding top
              nice: true,
            });

            const xPoint = (d: DataPoint) => (xScale(d.label) || 0) + xScale.bandwidth() / 2;
            const yPoint = (d: DataPoint) => yScale(d.value);

            // Hover handler for Tooltip
            const handleTooltip = (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
              const { x } = localPoint(event) || { x: 0 };
              const x0 = x - margin.left;
              
              // Find closest point based on X coordinate
              const step = xScale.step();
              const index = Math.max(0, Math.min(safeData.length - 1, Math.floor(x0 / step)));
              const d = safeData[index];
              
              if (d) {
                showTooltip({
                  tooltipData: d,
                  tooltipLeft: xPoint(d) + margin.left,
                  tooltipTop: yPoint(d) + margin.top,
                });
              }
            };

            return (
              <>
                <svg width={width} height={height}>
                  <rect x={0} y={0} width={width} height={height} fill="#ffffff" />
                  
                  <g transform={`translate(${margin.left},${margin.top})`}>
                    {/* Grid */}
                    <GridRows
                      scale={yScale}
                      width={innerWidth}
                      height={innerHeight}
                      stroke="#cbd5e1"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                    <GridColumns
                      scale={xScale}
                      width={innerWidth}
                      height={innerHeight}
                      stroke="#cbd5e1"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />

                    {type === 'column2d' ? (
                      // Bar Chart
                      safeData.map((d, i) => {
                        const barWidth = xScale.bandwidth();
                        const barHeight = innerHeight - yPoint(d);
                        const barX = xScale(d.label);
                        const barY = yPoint(d);
                        
                        const isHovered = tooltipData && tooltipData.label === d.label;
                        return (
                          <rect
                            key={`bar-${i}`}
                            x={barX}
                            y={barY}
                            width={barWidth}
                            height={barHeight}
                            fill={isHovered ? "#ec4899" : "#f472b6"} // pink-500 : pink-400
                            stroke="#0f172a" 
                            strokeWidth={3}
                            className="transition-all duration-300 ease-out"
                            onMouseMove={() => {
                              showTooltip({
                                tooltipData: d,
                                tooltipLeft: (barX || 0) + barWidth / 2 + margin.left,
                                tooltipTop: barY + margin.top,
                              });
                            }}
                            onMouseLeave={hideTooltip}
                            onTouchMove={() => {
                              showTooltip({
                                tooltipData: d,
                                tooltipLeft: (barX || 0) + barWidth / 2 + margin.left,
                                tooltipTop: barY + margin.top,
                              });
                            }}
                            onTouchEnd={hideTooltip}
                          />
                        );
                      })
                    ) : (
                      // Area Chart
                      <>
                        <AreaClosed
                          data={safeData}
                          x={xPoint}
                          y={yPoint}
                          yScale={yScale}
                          curve={curveMonotoneX}
                        >
                          {({ path }) => {
                            const d = path(safeData) || '';
                            return (
                              <motion.path
                                d={d}
                                fill="#c084fc"
                                opacity={0.4}
                                initial={false}
                                animate={{ d }}
                                transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
                              />
                            );
                          }}
                        </AreaClosed>
                        <LinePath
                          data={safeData}
                          x={xPoint}
                          y={yPoint}
                          curve={curveMonotoneX}
                        >
                          {({ path }) => {
                            const d = path(safeData) || '';
                            return (
                              <motion.path
                                d={d}
                                stroke="#0f172a"
                                strokeWidth={4}
                                fill="transparent"
                                initial={false}
                                animate={{ d }}
                                transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
                              />
                            );
                          }}
                        </LinePath>
                        {/* Data Points */}
                        {safeData.map((d, i) => {
                          const isHovered = tooltipData && tooltipData.label === d.label;
                          return (
                            <motion.circle
                              key={`point-${d.label}`} // Use label for key to animate properly
                              initial={false}
                              animate={{
                                cx: xPoint(d),
                                cy: yPoint(d),
                                r: isHovered ? 8 : 5,
                                fill: isHovered ? "#fbbf24" : "#c084fc",
                              }}
                              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                              stroke="#0f172a"
                              strokeWidth={3}
                            />
                          );
                        })}
                        
                        {/* Interactive Overlay for Hover */}
                        <Bar
                          x={0}
                          y={0}
                          width={innerWidth}
                          height={innerHeight}
                          fill="transparent"
                          rx={14}
                          onTouchStart={handleTooltip}
                          onTouchMove={handleTooltip}
                          onMouseMove={handleTooltip}
                          onMouseLeave={() => hideTooltip()}
                        />
                      </>
                    )}

                    <AxisBottom
                      top={innerHeight}
                      scale={xScale}
                      stroke="#0f172a"
                      strokeWidth={4}
                      tickStroke="#0f172a"
                      tickLabelProps={(val, index) => ({
                        fill: '#0f172a',
                        fontSize: 10,
                        textAnchor: 'middle',
                        fontWeight: '900',
                        opacity: (isHourly && index % 3 !== 0) ? 0 : 1
                      })}
                    />
                    <AxisLeft
                      scale={yScale}
                      stroke="#0f172a"
                      strokeWidth={4}
                      tickStroke="#0f172a"
                      tickLabelProps={() => ({
                        fill: '#0f172a',
                        fontSize: 12,
                        textAnchor: 'end',
                        dx: '-0.25em',
                        dy: '0.25em',
                        fontWeight: '900'
                      })}
                    />
                  </g>
                </svg>

                {tooltipData && (
                  <TooltipWithBounds
                    key={Math.random()}
                    top={tooltipTop}
                    left={tooltipLeft}
                    style={tooltipStyles}
                  >
                    <div className="uppercase">
                      <strong className="block text-xs text-purple-600 mb-1">{tooltipData.label}</strong>
                      <span className="text-xl">{tooltipData.value.toFixed(4)} <span className="text-sm">kWh</span></span>
                    </div>
                  </TooltipWithBounds>
                )}
              </>
            );
          }}
        </ParentSize>
      </div>
    </div>
  );
};

export default UsageChart;
