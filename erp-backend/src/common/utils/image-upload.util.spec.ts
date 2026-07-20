import { hasMagicBytes } from './image-upload.util';

/**
 * Guards the fix for a stored-XSS hole that was live and provable.
 *
 * A file called `payload.html`, uploaded with `Content-Type: image/png`, was
 * stored as `.html` and served back as `text/html` with its script intact —
 * arbitrary JS on Kotrim's own origin, where `script-src 'self'` is no defence,
 * reachable by anyone who signed up for a free trial.
 *
 * The client's mimetype is a claim, not evidence. These tests hold the line.
 */

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const webp = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP', 'ascii'),
]);
const html = Buffer.from('<html><script>alert(1)</script></html>', 'utf-8');
const wav = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from('WAVE', 'ascii'),
]);

describe('image upload — content verification', () => {
  describe('accepts genuine images', () => {
    it.each([
      ['image/png', png],
      ['image/jpeg', jpeg],
      ['image/webp', webp],
    ])('%s', (mimetype, buffer) => {
      expect(hasMagicBytes(buffer, mimetype)).toBe(true);
    });
  });

  describe('rejects a lie about the content type', () => {
    // The exact payload that worked before the fix.
    it('HTML claiming to be a PNG', () => {
      expect(hasMagicBytes(html, 'image/png')).toBe(false);
    });

    it('HTML claiming to be a JPEG', () => {
      expect(hasMagicBytes(html, 'image/jpeg')).toBe(false);
    });

    it('a JPEG claiming to be a PNG', () => {
      expect(hasMagicBytes(jpeg, 'image/png')).toBe(false);
    });

    it('a WAV claiming to be a WEBP — both start with RIFF', () => {
      // The subtle one: the signature matches and only bytes 8..12 disagree.
      expect(hasMagicBytes(wav, 'image/webp')).toBe(false);
    });
  });

  describe('rejects anything outside the allowlist', () => {
    it.each(['text/html', 'application/javascript', 'image/svg+xml', 'application/pdf'])(
      '%s',
      (mimetype) => {
        expect(hasMagicBytes(png, mimetype)).toBe(false);
      },
    );

    it('SVG in particular — it is an image that can carry script', () => {
      const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      expect(hasMagicBytes(svg, 'image/svg+xml')).toBe(false);
    });
  });

  describe('degenerate input', () => {
    it('an empty buffer matches nothing', () => {
      expect(hasMagicBytes(Buffer.alloc(0), 'image/png')).toBe(false);
    });

    it('a buffer shorter than the signature matches nothing', () => {
      expect(hasMagicBytes(Buffer.from([0x89, 0x50]), 'image/png')).toBe(false);
    });
  });
});
