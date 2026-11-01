import type { LinkSettings } from '../hooks/useLink';

export function linkStatusText(link: LinkSettings, status: string, mic: string, framesIn: number): string {
  if (link.mode === 'off') return 'Link off.';
  if (status !== 'connected') return `Network ${status === 'offline' ? 'offline, retrying' : 'connecting'}.`;
  const micText =
    mic === 'ready' ? 'mic ready' : mic === 'blocked' ? 'mic blocked (listen only)' : mic === 'unsupported' ? 'voice unsupported (needs https)' : 'mic starting';
  return `Network connected, ${micText}, audio in ${framesIn}.`;
}
