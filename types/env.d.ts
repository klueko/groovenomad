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

declare module "@env" {
  export const EXPO_PUBLIC_BETTER_AUTH_URL: string;
  export const EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      STRIPE_PUBLIC_KEY: string;
      STRIPE_SECRET_KEY: string;
      STRIPE_WEBHOOK_SECRET: string;
      STRIPE_WEBHOOK_SECRET_prod: string;
      AIRTABLE_API_KEY: string;
      AIRTABLE_BASE_ID: string;
      AIRTABLE_TABLE_ID: string;
    }
  }
}
