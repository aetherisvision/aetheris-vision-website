import type { QueryResultRow } from 'pg'

// Preserve the existing untyped SQL boundary; callers validate/cast their rows.
export type DatabaseRow = QueryResultRow
export type DatabaseQuery = Promise<DatabaseRow[]>

export interface QuerySql {
  (strings: TemplateStringsArray, ...values: unknown[]): DatabaseQuery
  query(text: string, values?: unknown[]): DatabaseQuery
}

export interface TransactionOptions {
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable'
  readOnly?: boolean
  deferrable?: boolean
}

export interface Sql extends QuerySql {
  transaction(queries: (sql: QuerySql) => DatabaseQuery[], options?: TransactionOptions): Promise<DatabaseRow[][]>
}
