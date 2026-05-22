/** Blog / insight article shape shared by static posts and ESMAI-generated JSON. */

export type Post = {
  id: number
  slug: string
  title: string
  date: string
  category: string
  featured?: boolean
  author: {
    name: string
    title: string
    initials: string
  }
  summary: string
  readTime: string
  content: string
}
