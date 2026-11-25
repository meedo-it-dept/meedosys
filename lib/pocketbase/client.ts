// =============================================================================
// MEEDOSys v2.0 - PocketBase Client & Database Adapter
// Provides native PocketBase SDK access and fluent query adapter
// =============================================================================

import PocketBase from 'pocketbase';

export const POCKETBASE_DEFAULT_URL = 'http://127.0.0.1:8090';

export const pocketbaseUrl =
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname
    ? `${window.location.protocol}//${window.location.hostname}:8090`
    : POCKETBASE_DEFAULT_URL);

// Instantiate standard PocketBase client
export const pb = new PocketBase(pocketbaseUrl);

// Disable auto-cancellation to allow concurrent requests across components
if (typeof pb.autoCancellation === 'function') {
  pb.autoCancellation(false);
}

// Bypass ngrok free tier interstitial warning page on API calls
pb.beforeSend = (url, options) => {
  options.headers = {
    ...options.headers,
    'ngrok-skip-browser-warning': 'true',
  };
  return { url, options };
};

export const isPocketBaseConfigured = Boolean(
  pocketbaseUrl &&
  !pocketbaseUrl.includes('your-project-id') &&
  !pocketbaseUrl.includes('placeholder')
);

function formatLikeFilter(column: string, value: any): string {
  const raw = String(value ?? '');
  const hasWildcard = raw.includes('%') || raw.includes('*');
  const pattern = hasWildcard ? raw.replace(/^[%*]+|[%*]+$/g, '') : raw;
  const escaped = pattern.replace(/"/g, '\\"');
  return hasWildcard ? `${column} ~ "${escaped}"` : `${column}="${escaped}"`;
}

// Deterministic 15-character lowercase alphanumeric ID generator for PocketBase
export function toPbId(rawId?: string | null): string {
  if (!rawId) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let res = '';
    for (let i = 0; i < 15; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
  }
  const clean = String(rawId).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.length === 15) return clean;

  // FNV-1a derived 64-bit split hash to 15 alphanumeric chars
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  for (let i = 0; i < rawId.length; i++) {
    const code = rawId.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 16777619);
    h2 = Math.imul(h2 ^ code, 1099511628);
  }
  const part1 = Math.abs(h1).toString(36);
  const part2 = Math.abs(h2).toString(36);
  const combined = (part1 + part2 + clean).padEnd(15, '0').slice(0, 15);
  return combined;
}

// Check PocketBase health / reachability
export async function checkPocketBase(): Promise<boolean> {
  try {
    const res = await pb.health.check();
    return res.code === 200;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// Fluent Database Adapter (PocketBase implementation of query / mutation builder)
// -----------------------------------------------------------------------------

export interface QueryResult<T = any> {
  data: T | null;
  error: any | null;
}

class InsertBuilder implements PromiseLike<QueryResult> {
  private collectionName: string;
  private payload: any | any[];

  constructor(collectionName: string, payload: any | any[]) {
    this.collectionName = collectionName;
    this.payload = payload;
  }

  select(columns?: string): this {
    return this;
  }

  single(): this {
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<QueryResult | TResult> {
    return this.execute().catch(onrejected);
  }

  private async execute(): Promise<QueryResult> {
    try {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const results: any[] = [];
      let lastError: any = null;

      for (const rawItem of items) {
        const item = { ...rawItem };
        if (item.id) {
          item.id = toPbId(item.id);
        }
        if (!item.created_at) {
          item.created_at = new Date().toISOString();
        }

        try {
          const created = await pb.collection(this.collectionName).create(item, { requestKey: null });
          results.push({
            ...created,
            created_at: created.created_at || created.created,
            updated_at: created.updated_at || created.updated,
          });
        } catch (itemErr: any) {
          if (item.id && itemErr?.status === 400) {
            try {
              const updated = await pb.collection(this.collectionName).update(item.id, item, { requestKey: null });
              results.push({
                ...updated,
                created_at: updated.created_at || updated.created,
                updated_at: updated.updated_at || updated.updated,
              });
              continue;
            } catch (retryErr: any) {
              lastError = retryErr;
            }
          } else {
            lastError = itemErr;
          }
          console.warn(`[PocketBase] insert warning for ${this.collectionName}:`, itemErr?.message || itemErr);
        }
      }

      if (results.length === 0 && lastError) {
        return { data: null, error: lastError };
      }

      return {
        data: Array.isArray(this.payload) ? results : (results[0] || null),
        error: null,
      };
    } catch (err: any) {
      console.warn(`[PocketBase] insert error for ${this.collectionName}:`, err);
      return { data: null, error: err };
    }
  }
}

class UpsertBuilder implements PromiseLike<QueryResult> {
  private collectionName: string;
  private payload: any | any[];
  private options?: { onConflict?: string };

  constructor(collectionName: string, payload: any | any[], options?: { onConflict?: string }) {
    this.collectionName = collectionName;
    this.payload = payload;
    this.options = options;
  }

  select(columns?: string): this {
    return this;
  }

  single(): this {
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<QueryResult | TResult> {
    return this.execute().catch(onrejected);
  }

  private async execute(): Promise<QueryResult> {
    try {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const conflictCol =
        this.options?.onConflict ||
        (items[0]?.stall_no
          ? 'stall_no'
          : items[0]?.guard_id
          ? 'guard_id'
          : items[0]?.username
          ? 'username'
          : items[0]?.butcher_code
          ? 'butcher_code'
          : items[0]?.reg_no
          ? 'reg_no'
          : 'id');

      const results: any[] = [];
      let lastError: any = null;

      for (const item of items) {
        let existingId: string | null = null;
        const lookupVal = item[conflictCol];

        if (conflictCol === 'id' && lookupVal) {
          const candidateId = toPbId(lookupVal);
          try {
            const found = await pb.collection(this.collectionName).getOne(candidateId, { requestKey: null });
            existingId = found?.id || null;
          } catch {
            existingId = null;
          }
        } else if (lookupVal) {
          try {
            const safeVal = String(lookupVal).replace(/"/g, '\\"');
            const found = await pb.collection(this.collectionName).getFirstListItem(`${conflictCol}="${safeVal}"`, {
              requestKey: null,
            });
            existingId = found.id;
          } catch {
            existingId = null;
          }
        }

        const dataToSave = { ...item };
        if (dataToSave.id) {
          dataToSave.id = toPbId(dataToSave.id);
        }

        if (existingId) {
          try {
            delete dataToSave.id;
            dataToSave.updated_at = new Date().toISOString();
            const updated = await pb.collection(this.collectionName).update(existingId, dataToSave, { requestKey: null });
            results.push({
              ...updated,
              created_at: updated.created_at || updated.created,
              updated_at: updated.updated_at || updated.updated,
            });
          } catch (upErr: any) {
            lastError = upErr;
            console.warn(`[PocketBase] upsert update warning for ${this.collectionName}:`, upErr);
          }
        } else {
          try {
            if (!dataToSave.created_at) dataToSave.created_at = new Date().toISOString();
            const created = await pb.collection(this.collectionName).create(dataToSave, { requestKey: null });
            results.push({
              ...created,
              created_at: created.created_at || created.created,
              updated_at: created.updated_at || created.updated,
            });
          } catch (crErr: any) {
            lastError = crErr;
            console.warn(`[PocketBase] upsert create warning for ${this.collectionName}:`, crErr);
          }
        }
      }

      if (results.length === 0 && lastError) {
        return { data: null, error: lastError };
      }

      return {
        data: Array.isArray(this.payload) ? results : (results[0] || null),
        error: null,
      };
    } catch (err: any) {
      console.warn(`[PocketBase] upsert error for ${this.collectionName}:`, err);
      return { data: null, error: err };
    }
  }
}

class UpdateBuilder implements PromiseLike<QueryResult> {
  private collectionName: string;
  private payload: any;
  private filters: string[] = [];
  private directId: string | null = null;

  constructor(collectionName: string, payload: any) {
    this.collectionName = collectionName;
    this.payload = payload;
  }

  eq(column: string, value: any): this {
    const val = column === 'id' ? toPbId(value) : value;
    if (column === 'id' && this.filters.length === 0) {
      this.directId = val;
    }
    const valStr =
      typeof val === 'boolean' ? String(val) : `"${String(val).replace(/"/g, '\\"')}"`;
    this.filters.push(`${column}=${valStr}`);
    return this;
  }

  ilike(column: string, value: any): this {
    this.filters.push(formatLikeFilter(column, value));
    return this;
  }

  like(column: string, value: any): this {
    this.filters.push(formatLikeFilter(column, value));
    return this;
  }

  neq(column: string, value: any): this {
    const val = column === 'id' ? toPbId(value) : value;
    const valStr =
      typeof val === 'boolean' ? String(val) : `"${String(val).replace(/"/g, '\\"')}"`;
    this.filters.push(`${column}!=${valStr}`);
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<QueryResult | TResult> {
    return this.execute().catch(onrejected);
  }

  private async execute(): Promise<QueryResult> {
    try {
      const filterStr = this.filters.join(' && ');
      const recordId: string | null = this.filters.length === 1 ? this.directId : null;

      if (recordId) {
        const updateData = { ...this.payload };
        delete updateData.id;
        updateData.updated_at = new Date().toISOString();
        const updated = await pb.collection(this.collectionName).update(recordId, updateData, { requestKey: null });
        return {
          data: {
            ...updated,
            created_at: updated.created_at || updated.created,
            updated_at: updated.updated_at || updated.updated,
          },
          error: null,
        };
      }

      if (filterStr) {
        const list = await pb.collection(this.collectionName).getFullList({
          filter: filterStr,
          requestKey: null,
        });
        if (list.length > 0) {
          const updatedList = [];
          const updateData = { ...this.payload };
          delete updateData.id;
          updateData.updated_at = new Date().toISOString();

          for (const item of list) {
            const up = await pb.collection(this.collectionName).update(item.id, updateData, { requestKey: null });
            updatedList.push({
              ...up,
              created_at: up.created_at || up.created,
              updated_at: up.updated_at || up.updated,
            });
          }
          return { data: updatedList.length === 1 ? updatedList[0] : updatedList, error: null };
        }
      }

      return { data: null, error: null };
    } catch (err: any) {
      console.warn(`[PocketBase] update error for ${this.collectionName}:`, err?.message || err);
      return { data: null, error: err };
    }
  }
}

class DeleteBuilder implements PromiseLike<QueryResult> {
  private collectionName: string;
  private filters: string[] = [];
  private directId: string | null = null;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  eq(column: string, value: any): this {
    const val = column === 'id' ? toPbId(value) : value;
    if (column === 'id' && this.filters.length === 0) {
      this.directId = val;
    }
    const valStr =
      typeof val === 'boolean' ? String(val) : `"${String(val).replace(/"/g, '\\"')}"`;
    this.filters.push(`${column}=${valStr}`);
    return this;
  }

  ilike(column: string, value: any): this {
    this.filters.push(formatLikeFilter(column, value));
    return this;
  }

  like(column: string, value: any): this {
    this.filters.push(formatLikeFilter(column, value));
    return this;
  }

  neq(column: string, value: any): this {
    const val = column === 'id' ? toPbId(value) : value;
    const valStr =
      typeof val === 'boolean' ? String(val) : `"${String(val).replace(/"/g, '\\"')}"`;
    this.filters.push(`${column}!=${valStr}`);
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<QueryResult | TResult> {
    return this.execute().catch(onrejected);
  }

  private async execute(): Promise<QueryResult> {
    try {
      const filterStr = this.filters.join(' && ');
      if (this.directId && this.filters.length === 1 && !filterStr.includes('!=')) {
        await pb.collection(this.collectionName).delete(this.directId, { requestKey: null });
        return { data: true, error: null };
      }

      if (filterStr) {
        const list = await pb.collection(this.collectionName).getFullList({
          filter: filterStr,
          requestKey: null,
        });
        for (const item of list) {
          await pb.collection(this.collectionName).delete(item.id, { requestKey: null });
        }
      }

      return { data: true, error: null };
    } catch (err: any) {
      console.warn(`[PocketBase] delete error for ${this.collectionName}:`, err?.message || err);
      return { data: null, error: err };
    }
  }
}

class QueryBuilder implements PromiseLike<QueryResult> {
  private collectionName: string;
  private sortOrder: string = '';
  private filters: string[] = [];
  private isSingle: boolean = false;
  private limitCount: number | null = null;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  select(_columns: string = '*'): this {
    return this;
  }

  eq(column: string, value: any): this {
    const val = column === 'id' ? toPbId(value) : value;
    const valStr = typeof val === 'boolean' ? String(val) : `"${String(val).replace(/"/g, '\\"')}"`;
    this.filters.push(`${column}=${valStr}`);
    return this;
  }

  neq(column: string, value: any): this {
    const val = column === 'id' ? toPbId(value) : value;
    const valStr = typeof val === 'boolean' ? String(val) : `"${String(val).replace(/"/g, '\\"')}"`;
    this.filters.push(`${column}!=${valStr}`);
    return this;
  }

  single(): this {
    this.isSingle = true;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    const asc = options?.ascending !== false;
    const colName = column === 'created' ? 'created_at' : column === 'updated' ? 'updated_at' : column;
    this.sortOrder = (asc ? '+' : '-') + colName;
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.executeGet().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<QueryResult | TResult> {
    return this.executeGet().catch(onrejected);
  }

  private async executeGet(): Promise<QueryResult> {
    try {
      const filterStr = this.filters.join(' && ');
      const records =
        this.isSingle || this.limitCount !== null
          ? (
              await pb.collection(this.collectionName).getList(1, this.limitCount || 1, {
                sort: this.sortOrder || '-created_at',
                filter: filterStr || undefined,
                requestKey: null,
              })
            ).items
          : await pb.collection(this.collectionName).getFullList({
              sort: this.sortOrder || '-created_at',
              filter: filterStr || undefined,
              requestKey: null,
            });

      // Normalize records (map created -> created_at, updated -> updated_at)
      const mapped = records.map((r: any) => ({
        ...r,
        created_at: r.created_at || r.created,
        updated_at: r.updated_at || r.updated,
      }));

      return {
        data: this.isSingle ? mapped[0] || null : mapped,
        error: null,
      };
    } catch (err: any) {
      console.warn(`[PocketBase] getFullList failed for ${this.collectionName}:`, err?.message || err);
      return { data: null, error: err };
    }
  }

  insert(payload: any | any[]) {
    return new InsertBuilder(this.collectionName, payload);
  }

  update(payload: any) {
    return new UpdateBuilder(this.collectionName, payload);
  }

  delete() {
    return new DeleteBuilder(this.collectionName);
  }

  upsert(payload: any | any[], options?: { onConflict?: string }) {
    return new UpsertBuilder(this.collectionName, payload, options);
  }
}

// Realtime Channel Manager
class RealtimeChannel {
  private channelName: string;
  private subscriptions: Array<{ table: string; handler: (payload: any) => void }> = [];

  constructor(channelName: string) {
    this.channelName = channelName;
  }

  on(
    event: string,
    filter: { event?: string; schema?: string; table: string },
    callback: (payload: any) => void
  ): this {
    this.subscriptions.push({
      table: filter.table,
      handler: callback,
    });
    return this;
  }

  subscribe(): this {
    if (typeof window === 'undefined') return this;

    this.subscriptions.forEach(({ table, handler }) => {
      try {
        pb.collection(table)
          .subscribe('*', (e: any) => {
            let eventType: 'INSERT' | 'UPDATE' | 'DELETE' = 'UPDATE';
            if (e.action === 'create') eventType = 'INSERT';
            else if (e.action === 'update') eventType = 'UPDATE';
            else if (e.action === 'delete') eventType = 'DELETE';

            const record = e.record
              ? {
                  ...e.record,
                  created_at: e.record.created_at || e.record.created,
                  updated_at: e.record.updated_at || e.record.updated,
                }
              : null;

            handler({
              eventType,
              new: eventType === 'INSERT' || eventType === 'UPDATE' ? record : null,
              old: eventType === 'DELETE' ? record : null,
            });
          })
          .catch((subErr) => {
            console.warn(`[PocketBase Realtime] subscribe error for ${table}:`, subErr);
          });
      } catch (err) {
        console.warn(`[PocketBase Realtime] setup error for ${table}:`, err);
      }
    });

    return this;
  }

  unsubscribe() {
    this.subscriptions.forEach(({ table }) => {
      try {
        pb.collection(table).unsubscribe('*');
      } catch {}
    });
  }
}

// Master Database Client Export
export const pbClient = {
  pb,
  from: (collectionName: string) => new QueryBuilder(collectionName),
  channel: (channelName: string) => new RealtimeChannel(channelName),
  removeChannel: (channel: RealtimeChannel) => {
    if (channel && typeof channel.unsubscribe === 'function') {
      channel.unsubscribe();
    }
  },
};

// Aliases for seamless drop-in backwards compatibility with existing components
export const supabase = pbClient;
export const isSupabaseConfigured = isPocketBaseConfigured;
