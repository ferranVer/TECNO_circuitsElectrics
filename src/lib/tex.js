import katex from 'katex';

export const tex = (s, display = false) =>
  katex.renderToString(s, { throwOnError: false, displayMode: display, output: 'html' });

export const r = String.raw;
