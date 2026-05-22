import fs from "fs"
import path from "path"

import type { Post } from "./postTypes"

const DATA_DIR = path.join(process.cwd(), "src/data/esmai-insights")

/**
 * Load ESMAI-published insight JSON files (from `esmai white-paper --publish`).
 * Safe at build time: missing directory yields an empty list.
 */
export function loadEsmaiInsightPosts(): Post[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      return []
    }
    return fs
      .readdirSync(DATA_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const raw = fs.readFileSync(path.join(DATA_DIR, f), "utf8")
        return JSON.parse(raw) as Post
      })
  } catch {
    return []
  }
}
