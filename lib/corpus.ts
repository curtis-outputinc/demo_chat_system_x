import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ACTIVE_VERTICAL } from './vertical';

// Each vertical's knowledge base lives in verticals/<VERTICAL>/corpus. The
// chatbot loads every markdown file in that directory at request time and
// concatenates it onto the system prompt (no embeddings, no chunking). If a
// vertical's corpus grows past prompt-cache scale (~100K tokens), RAG is on the
// table; not before.
const CORPUS_DIR = path.join(process.cwd(), 'verticals', ACTIVE_VERTICAL, 'corpus');

let cachedCorpus: string | null = null;

async function readMarkdownFiles(dir: string): Promise<{ path: string; content: string }[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    // Corpus directory not present yet (vertical not populated). Treat as empty.
    return [];
  }
  const files: { path: string; content: string }[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('_')) {
      const sub = await readMarkdownFiles(fullPath);
      files.push(...sub);
    } else if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('_')) {
      const content = await readFile(fullPath, 'utf-8');
      files.push({ path: path.relative(CORPUS_DIR, fullPath), content });
    }
  }

  return files;
}

export async function loadCorpus(): Promise<string> {
  if (cachedCorpus !== null) return cachedCorpus;

  const files = await readMarkdownFiles(CORPUS_DIR);
  files.sort((a, b) => a.path.localeCompare(b.path));

  const sections = files.map(({ path: filePath, content }) => {
    return `\n\n========================================\n# ${filePath}\n========================================\n\n${content}`;
  });

  cachedCorpus = sections.join('\n');
  return cachedCorpus;
}
