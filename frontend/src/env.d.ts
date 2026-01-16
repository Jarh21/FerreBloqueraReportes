interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  // más variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}