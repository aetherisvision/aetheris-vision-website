import type {
  NeonQueryFunctionInTransaction,
  NeonQueryInTransaction,
} from '@neondatabase/serverless'

export type MigrationSql = NeonQueryFunctionInTransaction<false, false>

export interface DatabaseMigration {
  id: string
  description: string
  up: (sql: MigrationSql) => NeonQueryInTransaction[]
}
