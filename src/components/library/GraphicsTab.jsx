import { useState, useRef } from 'react';
import SvgRenderer from '../shared/SvgRenderer';
import { useStore } from '../../store';
import { SAMPLE_GRAPHICS } from '../../assets';

export default function GraphicsTab() {
  const [search, setSearch] = useState('');
  const addDrawingGraphic = useStore(s => s.addDrawingGraphic);
  const fileRef = useRef(null);

  const filtered = search
    ? SAMPLE_GRAPHICS.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    : SAMPLE_GRAPHICS;

  const handleImport = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const text = await file.text();
      addDrawingGraphic({ svg: text, name: file.name.replace('.svg', '') });
    }
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Search bar */}
      <div style={{ padding: '10px 12px', display: 'flex', gap: 6, flexShrink: 0 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search graphics…"
            style={{
              width: '100%', paddingLeft: 28, paddingRight: 8, paddingTop: 6, paddingBottom: 6,
              background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
              color: '#e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          title="Import SVG"
          style={{
            padding: '6px 10px', background: '#1e293b',
            border: '1px solid #334155', borderRadius: 6,
            color: '#94a3b8', cursor: 'pointer', fontSize: 14,
          }}
        >
          ↑
        </button>
        <input ref={fileRef} type="file" accept=".svg" multiple style={{ display: 'none' }} onChange={handleImport} />
      </div>

      {/* Grid */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '0 8px 12px',
        display: 'flex', flexWrap: 'wrap', gap: 8, alignContent: 'flex-start',
      }}>
        {filtered.length === 0 && (
          <p style={{ color: '#4b5563', fontSize: 13, textAlign: 'center', width: '100%', marginTop: 20 }}>
            No graphics found
          </p>
        )}
        {filtered.map(item => (
          <AssetCard key={item.id} item={item} onAdd={() => addDrawingGraphic(item)} />
        ))}
      </div>
    </div>
  );
}

function AssetCard({ item, onAdd }) {
  return (
    <div style={{
      width: 106, background: '#1e293b', borderRadius: 8, padding: 8,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      border: '1px solid #334155', transition: 'border-color 0.15s, transform 0.1s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'none'; }}
    >
      <SvgRenderer svg={item.svg} style={{ width: 80, height: 80 }} />
      <span style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', lineHeight: 1.3 }}>
        {item.name}
      </span>
      <button
        onClick={onAdd}
        style={{
          width: '100%', padding: '4px 0',
          background: '#3b82f6', border: 'none', borderRadius: 4,
          color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
        onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
      >
        Add
      </button>
    </div>
  );
}
