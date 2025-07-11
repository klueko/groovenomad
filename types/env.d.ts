declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
    SPOTIFY_CLIENT_ID: string;
    SPOTIFY_CLIENT_SECRET: string;
    EXPO_PUBLIC_APP_SCHEME: string;
    DATABASE_URL?: string;
    SUPABASE_DB_PASSWORD?: string;
    SUPABASE_PROJECT_REF?: string;
  }
}
