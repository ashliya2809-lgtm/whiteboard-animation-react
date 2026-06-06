import EditorCanvas from './components/canvas/EditorCanvas';
import EditorLibrary from './components/library/EditorLibrary';
import EditorActions from './components/actions/EditorActions';
import EditorTimeline from './components/timeline/EditorTimeline';

export default function EditorView() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Middle row: library + canvas + actions */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <EditorLibrary />

        {/* Canvas area - centred, scrollable if viewport is tiny */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1526',
          overflow: 'auto',
          padding: 24,
        }}>
          <EditorCanvas />
        </div>

        <EditorActions />
      </div>

      {/* Bottom: timeline */}
      <EditorTimeline />
    </div>
  );
}
