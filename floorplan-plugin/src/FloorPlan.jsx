import { ZONES, AREA, VIEWBOX, EXITS, ESCAPE } from './zones.js';

// fill by metric: neutral area tint when there is no data, otherwise a blue ramp scaled to the max value.
function ramp(v, max) {
  if (!v) return null;
  const t = Math.min(1, Math.sqrt(v / max));
  const l = 92 - t * 52;
  return `hsl(221 80% ${l}%)`;
}

const centre = (z) => (z.rect ? [z.rect[0] + z.rect[2] / 2, z.rect[1] + z.rect[3] / 2] : z.label);
const tall = (z) => z.rect && z.rect[3] > z.rect[2] * 2;

export default function FloorPlan({ totals, selected, onSelect, mode, fmt }) {
  const max = Math.max(1, ...Object.values(totals));
  return (
    <svg viewBox={VIEWBOX} className="plan" role="img" aria-label="Facility floor plan">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="#8a4fb5" />
        </marker>
      </defs>
      <rect x="330" y="236" width="1085" height="1020" fill="var(--card)" stroke="#333" strokeWidth="3" />
      {ZONES.map((z) => {
        const v = totals[z.id] || 0;
        const fill = mode === 'heat' ? ramp(v, max) || AREA[z.type].fill : AREA[z.type].fill;
        const [cx, cy] = centre(z);
        const sel = selected === z.id;
        const shape = z.poly
          ? <polygon points={z.poly.join(' ')} />
          : <rect x={z.rect[0]} y={z.rect[1]} width={z.rect[2]} height={z.rect[3]} />;
        const dark = mode === 'heat' && v / max > 0.35;
        return (
          <g key={z.id} className={`zone${sel ? ' sel' : ''}${v ? ' has' : ''}`} style={{ '--fill': fill }}
             onClick={() => onSelect(sel ? null : z.id)} tabIndex={0} role="button" aria-label={`${z.name} ${v ? fmt(v) + ' units' : 'no data'}`}
             onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(sel ? null : z.id)}>
            {shape}
            <text x={cx} y={cy - (v ? 8 : 0)} textAnchor="middle" className={`zl${dark ? ' lt' : ''}`}
                  transform={tall(z) ? `rotate(-90 ${cx} ${cy})` : undefined}>{z.name.replace(/ #\d+$/, '')}</text>
            {v > 0 && (
              <text x={cx} y={cy + 16} textAnchor="middle" className={`zv${dark ? ' lt' : ''}`}
                    transform={tall(z) ? `rotate(-90 ${cx} ${cy})` : undefined}>{fmt(v)}</text>
            )}
          </g>
        );
      })}
      {ESCAPE.map((l, i) => (
        <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke="#8a4fb5" strokeWidth="5" strokeOpacity=".5" markerEnd="url(#arrow)" pointerEvents="none" />
      ))}
      {EXITS.map((e) => (
        <text key={e.name} x={e.x} y={e.y} textAnchor="middle" className="exit">{e.name}</text>
      ))}
      <text x="345" y="205" className="title">Waterville, ME Evacuation Routes</text>
    </svg>
  );
}
