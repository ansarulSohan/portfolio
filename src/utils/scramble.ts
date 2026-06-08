const GLYPHS = "!<>-_\\/[]{}=+*^?#@%ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * Returns `target` partially "decrypted": the first `progress` (0–1) fraction of
 * characters are revealed, the remainder are random glyphs. Whitespace is kept
 * intact so word shape is preserved. Pure — safe to call from render or a frame
 * loop.
 */
export function scramble(target: string, progress: number): string {
  const clamped = progress < 0 ? 0 : progress > 1 ? 1 : progress;
  const revealed = Math.floor(target.length * clamped);
  let out = "";
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    if (ch === " ") {
      out += " ";
    } else if (i < revealed) {
      out += ch;
    } else {
      out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
  }
  return out;
}
