import { vi } from 'vitest'

export interface QueryResult {
  data?: unknown
  error?: { message: string } | null
}

export interface RecordedQuery {
  table: string
  calls: Array<{ method: string; args: unknown[] }>
}

/**
 * Chainable mock for the supabase-js query builder. Any method call
 * (`select`, `eq`, `update`, `maybeSingle`, …) returns the same chain, and
 * awaiting the chain resolves to the configured result for that table.
 *
 * `tables` maps a table name to a result (used for every query on it) or a
 * queue of results consumed one per `from(table)` call — the last entry is
 * reused once the queue runs out. `rpc` maps a function name to a result or
 * a function of the call args.
 */
export function createSupabaseMock(options: {
  tables?: Record<string, QueryResult | QueryResult[]>
  rpc?: Record<string, QueryResult | ((args: Record<string, unknown>) => QueryResult)>
} = {}) {
  const queries: RecordedQuery[] = []
  const rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = []
  const queues = new Map<string, QueryResult[]>()
  for (const [table, res] of Object.entries(options.tables ?? {})) {
    queues.set(table, Array.isArray(res) ? [...res] : [res])
  }

  function chain(result: QueryResult, record: RecordedQuery) {
    const proxy: Record<string, unknown> = new Proxy(
      {},
      {
        get(_target, prop: string) {
          if (prop === 'then') {
            const value = { data: null, error: null, ...result }
            return (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
              Promise.resolve(value).then(resolve, reject)
          }
          return (...args: unknown[]) => {
            record.calls.push({ method: prop, args })
            return proxy
          }
        },
      }
    )
    return proxy
  }

  const from = vi.fn((table: string) => {
    const queue = queues.get(table) ?? []
    const result = queue.length > 1 ? queue.shift()! : (queue[0] ?? {})
    const record: RecordedQuery = { table, calls: [] }
    queries.push(record)
    return chain(result, record)
  })

  const rpc = vi.fn(async (fn: string, args: Record<string, unknown> = {}) => {
    rpcCalls.push({ fn, args })
    const spec = options.rpc?.[fn]
    const result = typeof spec === 'function' ? spec(args) : (spec ?? {})
    return { data: null, error: null, ...result }
  })

  return { client: { from, rpc }, from, rpc, queries, rpcCalls }
}

/** The recorded queries against one table, in call order. */
export function queriesFor(queries: RecordedQuery[], table: string): RecordedQuery[] {
  return queries.filter((q) => q.table === table)
}

/** True if any query on `table` invoked `method` (e.g. 'update'). */
export function tableCalled(queries: RecordedQuery[], table: string, method: string): boolean {
  return queriesFor(queries, table).some((q) => q.calls.some((c) => c.method === method))
}
