import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from 'react';
import { copy } from '../copy/en';

type TabId = 'controls' | 'math';
const TABS: { id: TabId; label: string }[] = [
  { id: 'controls', label: copy.shell.controlsTab },
  { id: 'math', label: copy.shell.mathTab },
];

/** The right inspector: two tabs, Controls and The math (decision #12). */
export function Inspector({ controls, math }: { controls: ReactNode; math: ReactNode }) {
  const [active, setActive] = useState<TabId>('controls');
  const id = useId();
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next = active === 'controls' ? 'math' : 'controls';
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <aside className="inspector" aria-label={copy.shell.inspectorLabel}>
      <div className="tabs" role="tablist" onKeyDown={onKeyDown}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${tab.id}`}
            className="tab ml-focusable"
            aria-selected={active === tab.id}
            aria-controls={`${id}-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {TABS.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${id}-panel-${tab.id}`}
          aria-labelledby={`${id}-tab-${tab.id}`}
          className={`tab-panel${tab.id === 'math' ? ' math-panel' : ''}`}
          hidden={active !== tab.id}
          tabIndex={0}
        >
          {tab.id === 'controls' ? controls : math}
        </div>
      ))}
    </aside>
  );
}
