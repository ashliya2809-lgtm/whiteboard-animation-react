import { useStore } from '../../store';
import GraphicItem from './GraphicItem';
import { getBoardStyle } from '../../utils/animation';

const CANVAS_W = 800;
const CANVAS_H = 450;

export default function EditorCanvas({ playing = false }) {
  const getSelectedScene = useStore(s => s.getSelectedScene);
  const selectedGraphicId = useStore(s => s.selectedGraphicId);
  const selectGraphic = useStore(s => s.selectGraphic);
  const project = useStore(s => s.project);

  const scene = getSelectedScene();
  const boardStyle = getBoardStyle(project?.boardType ?? 'whiteboard');

  return (
    <div style={{
      position: 'relative',
      width: CANVAS_W,
      height: CANVAS_H,
      ...boardStyle,
      borderRadius: 6,
      overflow: 'hidden',
      boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      flexShrink: 0,
    }}
      onClick={() => selectGraphic(null)}
    >
      {scene?.graphics.map(g => (
        <GraphicItem
          key={g.id}
          graphic={g}
          isSelected={selectedGraphicId === g.id}
          playing={playing}
        />
      ))}

      {/* Empty state */}
      {(!scene || scene.graphics.length === 0) && !playing && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          color: project?.boardType === 'whiteboard' ? '#d1d5db' : '#3a5a3a',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <p style={{ marginTop: 12, fontSize: 14, fontFamily: 'Georgia, serif' }}>
            Add items from the Library panel
          </p>
        </div>
      )}
    </div>
  );
}
