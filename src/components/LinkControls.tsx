import type { ReactNode } from 'react';
import type { LinkSettings } from '../hooks/useLink';

const LINK_LABEL = { off: 'off', network: 'network' } as const;

/** Link toggle and status line, shared by every device. The link works over the network only. */
export function LinkControls({ link, onToggle, statusText, before }: { link: LinkSettings; onToggle: () => void; statusText: string; before?: ReactNode }) {
  return (
    <>
      <div className="rs-link-row">
        {before}
        <button type="button" className="rs-view-btn" aria-pressed={link.mode !== 'off'} onClick={onToggle}>
          {`Link: ${LINK_LABEL[link.mode]}`}
        </button>
      </div>
      <p className="rs-muted rs-small" role="status" aria-label="Link status">
        {statusText}
      </p>
      <p className="rs-muted rs-small">
        Link is a simulator feature and works over the network only. A radio hears another one, on any device, that is keyed
        on the same frequency; push-to-talk voice goes through a relay to everyone else using the site. No RF.
      </p>
    </>
  );
}
