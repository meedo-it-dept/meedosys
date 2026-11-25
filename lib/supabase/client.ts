// =============================================================================
// MEEDOSys v2.0 - Database Compatibility Bridge
// Re-exports PocketBase client to maintain seamless zero-downtime compatibility
// =============================================================================

export {
  pbClient as supabase,
  isPocketBaseConfigured as isSupabaseConfigured,
  pbClient,
  pb,
  isPocketBaseConfigured,
  pocketbaseUrl,
  toPbId,
  checkPocketBase,
} from '../pocketbase/client';
