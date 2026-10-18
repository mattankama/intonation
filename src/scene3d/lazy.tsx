import { type ComponentType, Suspense, lazy } from 'react';

/**
 * A Lab's scene component, loaded on first render in its own chunk with three.js.
 * Until it arrives, an empty scene box of the same size holds its place.
 *
 *   const PitchSpiral = lazyScene(() => import('./PitchSpiral'), { label, className });
 */
export function lazyScene<P extends object>(
  load: () => Promise<{ default: ComponentType<P> }>,
  placeholder: { label: string; className?: string },
): ComponentType<P> {
  const Scene = lazy(load);
  function LazyScene(props: P) {
    return (
      <Suspense
        fallback={
          <div
            className={`scene3d ${placeholder.className ?? ''}`}
            role="group"
            aria-label={placeholder.label}
            aria-busy="true"
          />
        }
      >
        <Scene {...props} />
      </Suspense>
    );
  }
  return LazyScene;
}
