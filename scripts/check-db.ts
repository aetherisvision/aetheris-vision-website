import { sql } from '../src/lib/db/index'

async function main() {
  const clients = await sql`SELECT * FROM clients`
  const projects = await sql`SELECT id, client_id, name, status FROM projects`
  console.log('CLIENTS:', JSON.stringify(clients, null, 2))
  console.log('PROJECTS:', JSON.stringify(projects, null, 2))
}

main().catch(console.error)
