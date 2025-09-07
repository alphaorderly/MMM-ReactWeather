// Global ambient types for MagicMirror runtime (minimal subset)
// You can expand these as needed for stronger typing.

declare const Module: any;
declare const Log: {
  info: (...args: any[]) => void;
  error: (...args: any[]) => void;
};

interface ImportMetaHot {
  accept: (...args: any[]) => void;
  dispose: (cb: () => void) => void;
}

interface ImportMeta {
  readonly hot?: ImportMetaHot;
}
