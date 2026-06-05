import { useState } from 'react';
import GraphicsTab from './GraphicsTab';
import ShapesTab from './ShapesTab';
import TextTab from './TextTab';

const TABS = [
  { id: 'graphics', label: 'Graphics', icon: '👤' },
  { id: 'shapes',   label: 'Shapes',   icon: '⬟' },
  { id: 'text',     label: 'Text',     icon: 'T' },
  { id: 'audio',    label: 'Audio',    icon: '♪' },
];

export default function EditorLibrary() {
  const [activeTab, setActiveTab] = useState('graphics');

  return (
    <div style={{
      width: 256,
      background: '#111827',
      borderRight: '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Panel header */}
      <div style={{
        padding: '12px 14px 0',
        borderBottom: '1px solid #1e293b',
      }}>
        <p style={{
          fontSize: 10, fontWeight: 700, color: '#64748b',
          letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10,
        }}>
          Library
        </p>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              style={{
                flex: 1, padding: '8px 0',
                background: 'none', border: 'none',
                color: activeTab === tab.id ? '#f59e0b' : '#6b7280',
                fontSize: tab.id === 'text' ? 13 : 17,
                fontWeight: 700,
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #f59e0b' : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#6b7280'; }}
            >
              {tab.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'graphics' && <GraphicsTab />}
        {activeTab === 'shapes' && <ShapesTab />}
        {activeTab === 'text' && <TextTab />}
        {activeTab === 'audio' && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: '#374151', gap: 12,
          }}>
            <div style={{ fontSize: 40 }}>🎵</div>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: '#4b5563' }}>Under construction</p>
          </div>
        )}
      </div>
    </div>
  );
}
