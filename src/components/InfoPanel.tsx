import { ACCURACY_TEXT } from './controlInfo';
import { CONTROL_ACCURACY, CONTROL_LABEL, type ControlId } from '../radio';

export function InfoPanel({ lastControl }: { lastControl: ControlId | null }) {
  return (
    <section className="rs-panel" aria-labelledby="info-title">
      <h2 id="info-title">
        Control status <span className="rs-sim-tag">Simulator</span>
      </h2>
      {lastControl === null ? (
        <p className="rs-muted">Press or turn a control to see its accuracy status.</p>
      ) : (
        <dl className="rs-info">
          <dt>Control</dt>
          <dd>
            {CONTROL_LABEL[lastControl]} <code>{lastControl}</code>
          </dd>
          <dt>Accuracy</dt>
          <dd>
            <strong>{CONTROL_ACCURACY[lastControl]}</strong>. {ACCURACY_TEXT[CONTROL_ACCURACY[lastControl]]}
          </dd>
        </dl>
      )}
      <p className="rs-muted">
        Behavior shown here is a simulator approximation. Only controls with Verified-public-doc status would be
        verified, and none are yet.
      </p>
    </section>
  );
}
