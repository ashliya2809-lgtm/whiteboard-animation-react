import { useStore } from '../../store';
import SceneThumbnail from './SceneThumbnail';

export default function EditorTimeline() {
  const project = useStore(s => s.project);
  const selectedSceneId = useStore(s => s.selectedSceneId);
  const addScene = useStore(s => s.addScene);

  if (!project) return null;
  const scenes = project.scenes;

  return (
    <div style={{
      height: 120,
      background: '#0f172a',
      borderTop: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 12,
      overflowX: 'auto',
      flexShrink: 0,
    }}>
      {/* Label */}
      <div style={{
        color: '#475569', fontSize: 10,
        fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: 1.5, flexShrink: 0,
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
        userSelect: 'none',
      }}>
        Timeline
      </div>

      {/* Scene thumbnails */}
      {scenes.map((scene, idx) => (
        <SceneThumbnail
          key={scene.id}
          scene={scene}
          index={idx}
          totalScenes={scenes.length}
          isSelected={scene.id === selectedSceneId}
        />
      ))}

      {/* Add scene button */}
      <button
        onClick={addScene}
        title="Add Scene"
        style={{
          width: 72, height: 72,
          background: '#1e293b',
          border: '2px dashed #334155',
          borderRadius: 8,
          color: '#64748b',
          fontSize: 28,
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#f59e0b';
          e.currentTarget.style.color = '#f59e0b';
          e.currentTarget.style.background = '#1e293b';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#334155';
          e.currentTarget.style.color = '#64748b';
        }}
      >
        +
      </button>
    </div>
  );
}
