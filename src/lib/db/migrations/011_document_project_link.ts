import type { DatabaseMigration } from './types'

export const documentProjectLinkMigration: DatabaseMigration = {
  id: '011_document_project_link',
  description: 'Add the nullable document project link expected by project history guards',
  up: sql => [
    sql.query(`ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS project_id integer REFERENCES projects(id) ON DELETE SET NULL`),
    sql.query('CREATE INDEX IF NOT EXISTS documents_project_id_idx ON documents (project_id)'),
  ],
}
