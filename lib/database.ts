import * as schema from "./schema";

// Dans React Native, on ne peut pas utiliser postgres directement
// On doit passer par l'API HTTP ou utiliser Supabase
export const db = {
  // Placeholder pour l'API client - sera remplacé par des appels HTTP
  schema,
  // Les opérations DB seront gérées via l'API HTTP
  query: null as any,
  select: null as any,
  insert: null as any,
  update: null as any,
  delete: null as any,
};

// Note: Pour les opérations DB dans React Native, utilisez l'API HTTP
// Exemple: fetch('/api/users') au lieu de db.select().from(users)
console.warn("Database operations in React Native should use HTTP API calls");
