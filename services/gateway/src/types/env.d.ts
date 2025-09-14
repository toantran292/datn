declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    IDENTITY_URL: string;
    ORG_MAP?: string; // "slug:uuid, slug2:uuid2"
  }
}