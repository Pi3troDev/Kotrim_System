/**
 * The visual language of every Kotrim e-mail.
 *
 * Values mirror the landing page's tokens (erp-frontend landing.tokens.scss) —
 * `#011c63` is the navy sampled from the logo itself. Duplicated here rather
 * than imported because the two run in different processes; when the palette
 * moves, both move.
 *
 * Everything is a literal hex: e-mail clients do not support CSS custom
 * properties, and Gmail strips `<style>` blocks entirely, so every rule has to
 * be inlined at the point of use.
 */
export const theme = {
  color: {
    navy900: '#011c63',
    navy950: '#010b28',
    blue600: '#1b4de4',
    blue500: '#2d6bff',
    blue100: '#dde7ff',

    ink: '#0b0d12',
    muted: '#5a6272',
    faint: '#8b93a5',
    paper: '#ffffff',
    mist: '#f4f6fa',
    line: '#e3e8f0',
    lineSoft: '#eef1f6',

    ok: '#12b76a',
    okSoft: '#e7f8f0',
    warn: '#b45f06',
    warnSoft: '#fff4e5',
    danger: '#b42318',
    dangerSoft: '#fef3f2',
  },

  /**
   * No webfonts: Outlook ignores @font-face and Gmail blocks the request, so a
   * linked Archivo/Inter would silently fall back on the clients that matter
   * most. A system stack renders natively everywhere and never flashes.
   */
  font: {
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },

  size: {
    /** 600px is the widest an e-mail can be before Outlook's preview pane clips it. */
    container: 600,
    radius: 12,
    radiusSm: 8,
  },
} as const;
