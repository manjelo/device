import type { ViewId } from './controlInfo';

const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'top', label: 'Top' },
];

export function ViewSwitcher({ view, onChange }: { view: ViewId; onChange: (view: ViewId) => void }) {
  return (
    <div className="rs-views" role="group" aria-label="Radio view">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          type="button"
          className="rs-view-btn"
          aria-pressed={view === v.id}
          onClick={() => onChange(v.id)}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
