import { useState } from 'react';
import type { PaperSection, ArchitectureData, ComparisonData, ChartData, FlowchartData, TableData, TimelineData } from '../lib/types';
import { Lightbulb } from 'lucide-react';

const NoData = () => <p style={{ color: '#475569', fontSize: '12px', fontStyle: 'italic' }}>No visualization data available</p>;

function ArchitectureViz({ data }: { data: ArchitectureData }) {
  if (!data?.nodes?.length) return <NoData />;
  const nodeMap = new Map(data.nodes.map((n, i) => [n.id, { ...n, idx: i }]));
  const cols = Math.ceil(Math.sqrt(data.nodes.length));
  const nodeW = 140, nodeH = 50, gapX = 40, gapY = 30;
  const pos = (idx: number) => ({
    x: 30 + (idx % cols) * (nodeW + gapX),
    y: 30 + Math.floor(idx / cols) * (nodeH + gapY),
  });
  const svgW = cols * (nodeW + gapX) + 30;
  const svgH = (Math.ceil(data.nodes.length / cols)) * (nodeH + gapY) + 30;
  const typeColors: Record<string, string> = { input: '#3b82f6', process: '#8b5cf6', output: '#22c55e', model: '#f59e0b' };

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', maxHeight: 300, background: '#0f172a', borderRadius: '6px' }}>
      {data.edges.map((e, i) => {
        const from = nodeMap.get(e.from);
        const to = nodeMap.get(e.to);
        if (!from || !to) return null;
        const fp = pos(from.idx);
        const tp = pos(to.idx);
        return (
          <g key={i}>
            <line x1={fp.x + nodeW / 2} y1={fp.y + nodeH} x2={tp.x + nodeW / 2} y2={tp.y} stroke="#475569" strokeWidth={1.5} markerEnd="url(#ah)" />
            {e.label && <text x={(fp.x + tp.x + nodeW) / 2} y={(fp.y + nodeH + tp.y) / 2} textAnchor="middle" style={{ fontSize: '8px', fill: '#64748b' }}>{e.label}</text>}
          </g>
        );
      })}
      {data.nodes.map((n, i) => {
        const p = pos(i);
        const color = typeColors[n.type] || '#475569';
        return (
          <g key={n.id}>
            <rect x={p.x} y={p.y} width={nodeW} height={nodeH} rx={6} fill={`${color}20`} stroke={color} strokeWidth={1.5} />
            <text x={p.x + nodeW / 2} y={p.y + 20} textAnchor="middle" style={{ fontSize: '10px', fill: '#e2e8f0', fontWeight: 600 }}>{n.label}</text>
            <text x={p.x + nodeW / 2} y={p.y + 34} textAnchor="middle" style={{ fontSize: '8px', fill: '#64748b' }}>{n.type}</text>
          </g>
        );
      })}
      <defs><marker id="ah" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#475569" /></marker></defs>
    </svg>
  );
}

function ComparisonViz({ data }: { data: ComparisonData }) {
  if (!data?.items?.length) return <NoData />;
  const allMetrics = data.items[0]?.values?.map(v => v.metric) || [];
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{['', ...allMetrics].map((h, i) => <th key={i} style={{ padding: '8px', textAlign: i ? 'right' : 'left', color: '#64748b', borderBottom: '1px solid #334155' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ padding: '8px', color: '#cbd5e1', fontWeight: 600 }}>{item.label}</td>
              {item.values.map((v, j) => (
                <td key={j} style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace', color: '#94a3b8' }}>
                  {v.value}{v.unit ? ` ${v.unit}` : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartViz({ data }: { data: ChartData }) {
  if (!data?.series?.length) return <NoData />;
  const w = 500, h = 200, pad = { t: 15, r: 15, b: 25, l: 45 };
  const allY = data.series.flatMap(s => s.data.map(d => d.y));
  const minY = Math.min(...allY), maxY = Math.max(...allY);
  const rangeY = maxY - minY || 1;
  const maxX = data.series[0].data.length - 1;
  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: w, background: '#0f172a', borderRadius: '6px' }}>
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} stroke="#1e293b" />
      <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#1e293b" />
      <text x={pad.l - 4} y={pad.t + 4} textAnchor="end" style={{ fontSize: '8px', fill: '#475569' }}>{maxY.toFixed(1)}</text>
      <text x={pad.l - 4} y={h - pad.b} textAnchor="end" style={{ fontSize: '8px', fill: '#475569' }}>{minY.toFixed(1)}</text>
      {data.xLabel && <text x={(w + pad.l) / 2} y={h - 4} textAnchor="middle" style={{ fontSize: '8px', fill: '#475569' }}>{data.xLabel}</text>}
      {data.series.map((s, si) => {
        const pts = s.data.map((d, i) => {
          const x = pad.l + (i / maxX) * (w - pad.l - pad.r);
          const y = pad.t + (1 - (d.y - minY) / rangeY) * (h - pad.t - pad.b);
          return `${x},${y}`;
        }).join(' ');
        const c = s.color || colors[si % colors.length];
        return <polyline key={si} points={pts} fill="none" stroke={c} strokeWidth={2} />;
      })}
      {data.series.map((s, si) => (
        <g key={`l-${si}`}><line x1={pad.l + 8} y1={pad.t + 8 + si * 14} x2={pad.l + 22} y2={pad.t + 8 + si * 14} stroke={s.color || colors[si % colors.length]} strokeWidth={2} />
          <text x={pad.l + 26} y={pad.t + 11 + si * 14} style={{ fontSize: '8px', fill: '#94a3b8' }}>{s.name}</text></g>
      ))}
    </svg>
  );
}

function FlowchartViz({ data }: { data: FlowchartData }) {
  if (!data?.steps?.length) return <NoData />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
      {data.steps.map((step, i) => (
        <div key={step.id}>
          <div style={{
            background: '#1e293b', borderRadius: '8px', padding: '12px 16px', textAlign: 'center',
            border: `1px solid ${step.type === 'start' ? '#3b82f6' : step.type === 'end' ? '#22c55e' : '#334155'}`,
            minWidth: '200px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>{step.label}</div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{step.description}</div>
          </div>
          {i < data.steps.length - 1 && (
            <div style={{ textAlign: 'center', color: '#475569', fontSize: '16px' }}>↓</div>
          )}
        </div>
      ))}
    </div>
  );
}

function TableViz({ data }: { data: TableData }) {
  if (!data?.headers?.length || !data?.rows?.length) return <NoData />;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{data.headers.map((h, i) => (
            <th key={i} style={{
              padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right', color: '#64748b',
              borderBottom: '1px solid #334155', fontWeight: 500,
              background: i === data.highlightColumn ? '#1e40af20' : undefined,
            }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid #1e293b' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: '8px 12px', textAlign: ci === 0 ? 'left' : 'right',
                  fontFamily: ci > 0 ? 'monospace' : undefined, color: '#94a3b8',
                  background: ci === data.highlightColumn ? '#1e40af20' : undefined,
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimelineViz({ data }: { data: TimelineData }) {
  if (!data?.events?.length) return <NoData />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', paddingLeft: '20px', borderLeft: '2px solid #334155' }}>
      {data.events.map((ev, i) => (
        <div key={i} style={{ position: 'relative', paddingLeft: '20px', paddingBottom: '20px' }}>
          <div style={{
            position: 'absolute', left: '-7px', top: '4px', width: '12px', height: '12px', borderRadius: '50%',
            background: ev.type === 'milestone' ? '#22c55e' : ev.type === 'result' ? '#3b82f6' : '#475569',
            border: '2px solid #0f172a',
          }} />
          <div style={{ fontSize: '10px', color: '#64748b' }}>{ev.date}</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>{ev.title}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{ev.description}</div>
        </div>
      ))}
    </div>
  );
}

function Visualization({ type, data }: { type: string; data: any }) {
  if (!data) return <NoData />;
  switch (type) {
    case 'architecture': return <ArchitectureViz data={data} />;
    case 'comparison': return <ComparisonViz data={data} />;
    case 'chart': return <ChartViz data={data} />;
    case 'flowchart': return <FlowchartViz data={data} />;
    case 'table': return <TableViz data={data} />;
    case 'timeline': return <TimelineViz data={data} />;
    default: return <p style={{ color: '#475569', fontSize: '12px' }}>Unknown visualization type: {type}</p>;
  }
}

export function SectionCard({ section, index }: { section: PaperSection; index: number }) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 600 }}>SECTION {index + 1}</span>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', margin: '4px 0 8px' }}>{section.title}</h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>{section.summary}</p>
      </div>

      {/* Key insight */}
      <div style={{
        display: 'flex', gap: '10px', padding: '12px', borderRadius: '8px',
        background: '#451a03', border: '1px solid #92400e', marginBottom: '16px',
      }}>
        <Lightbulb size={16} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '1px' }} />
        <span style={{ fontSize: '12px', color: '#fcd34d', lineHeight: 1.5 }}>{section.keyInsight}</span>
      </div>

      {/* Visualization */}
      <div style={{ marginBottom: '16px' }}>
        <Visualization type={section.visualizationType} data={section.visualizationData} />
      </div>

      {/* Interactive elements */}
      {section.interactiveElements.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {section.interactiveElements.map((el, i) => {
            if (el.type === 'stepper') {
              const config = el.config as { steps: { label: string; description: string }[] };
              return (
                <div key={i} style={{ background: '#1e293b', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>{el.label}</div>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    {config.steps.map((_, si) => (
                      <button key={si} onClick={() => setActiveStep(si)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
                          background: si === activeStep ? '#2563eb' : '#0f172a', color: si === activeStep ? '#fff' : '#64748b',
                          fontSize: '11px', fontWeight: 600,
                        }}>
                        {si + 1}
                      </button>
                    ))}
                  </div>
                  {config.steps[activeStep] && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>{config.steps[activeStep].label}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{config.steps[activeStep].description}</div>
                    </div>
                  )}
                </div>
              );
            }
            if (el.type === 'toggle') {
              return (
                <ToggleElement key={i} label={el.label} description={el.description} config={el.config as any} />
              );
            }
            return (
              <div key={i} style={{ background: '#1e293b', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{el.label}</div>
                <div style={{ fontSize: '10px', color: '#475569' }}>{el.description}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ToggleElement({ label, description, config }: { label: string; description: string; config: { onLabel: string; offLabel: string } }) {
  const [on, setOn] = useState(false);
  return (
    <div style={{ background: '#1e293b', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{label}</div>
        <div style={{ fontSize: '10px', color: '#64748b' }}>{description}</div>
      </div>
      <button onClick={() => setOn(!on)} style={{
        padding: '4px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer',
        background: on ? '#166534' : '#334155', color: on ? '#22c55e' : '#94a3b8', fontSize: '10px', fontWeight: 600,
      }}>
        {on ? config.onLabel : config.offLabel}
      </button>
    </div>
  );
}
