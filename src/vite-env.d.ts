/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PASSWORD_PROTECTED?: string;
  readonly VITE_APP_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
