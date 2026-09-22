import type { DatabaseQuery, QuerySql } from '../types'

export type MigrationSql = QuerySql

export interface DatabaseMigration {
  id: string
  description: string
  up: (sql: MigrationSql) => DatabaseQuery[]
}
