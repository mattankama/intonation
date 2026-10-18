import { edoApproximations, edoSystem } from '../../core';
import { copy } from '../../copy/en';
import { formatCents, formatRatio, formatSignedCents } from '../../format/numbers';
import type { LabProps } from '../registry';
import { EdoCircle } from './EdoCircle';
import { EdoErrorChart } from './EdoErrorChart';
import { useExploredEdo } from './exploredEdo';

const text = copy.edoExplorer;

/**
 * EDO explorer: the circle of N steps with the pure intervals marked at their nearest
 * steps, the exact errors in a table, and the error chart across every N.
 */
export function EdoExplorerVisual({ settings }: LabProps) {
  const { n, choose } = useExploredEdo(settings);
  const approximations = edoApproximations(n);
  const edoName = copy.settings.tuningSystem.name(edoSystem(n));
  return (
    <div className="edo-visual">
      <div className="edo-top">
        <EdoCircle n={n} approximations={approximations} />
        <table className="edo-table">
          <caption className="edo-table-caption">{text.tableCaption(edoName)}</caption>
          <thead>
            <tr>
              <th scope="col">{text.columns.interval}</th>
              <th scope="col" className="edo-col-pure">{text.columns.pure}</th>
              <th scope="col">{text.columns.step}</th>
              <th scope="col">{text.columns.size}</th>
              <th scope="col">{text.columns.error}</th>
            </tr>
          </thead>
          <tbody>
            {approximations.map((a) => {
              const ratio = formatRatio(a.target);
              return (
                <tr key={ratio}>
                  <th scope="row">
                    {ratio} <span className="edo-interval-name">{text.targetNames[ratio]}</span>
                  </th>
                  <td className="edo-col-pure">{formatCents(a.pureCents, 'math')}</td>
                  <td>{a.step}</td>
                  <td>{formatCents(a.stepCents, 'math')}</td>
                  <td className="edo-error">{formatSignedCents(a.error, 'math')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <EdoErrorChart selected={n} onSelect={choose} />
    </div>
  );
}
