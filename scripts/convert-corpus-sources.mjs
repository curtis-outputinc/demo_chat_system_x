#!/usr/bin/env node
// Convert all .docx and .pdf files inside a corpus folder to .md, in place,
// keeping the same basename. Removes the originals after a successful convert.
//
// Usage: node scripts/convert-corpus-sources.mjs <corpus-dir>
//   e.g. node scripts/convert-corpus-sources.mjs verticals/insurance-broker/corpus

import { readdir, readFile, writeFile, unlink, copyFile } from 'node:fs/promises';
import { join, basename, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function walk(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
}

function extractDocxText(docxPath) {
  // Copy to a path with no spaces for unzip, then extract document.xml
  const tmpZip = join(root, 'scripts', `_tmp_${Date.now()}.zip`);
  execFileSync('cp', [docxPath, tmpZip]);
  const xml = execFileSync('unzip', ['-p', tmpZip, 'word/document.xml']).toString('utf-8');
  execFileSync('rm', [tmpZip]);
  let out = '';
  const paraRe = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
  let m;
  while ((m = paraRe.exec(xml)) !== null) {
    const para = m[1];
    const texts = [...para.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((t) => t[1]).join('');
    const isH1 = /w:pStyle w:val=\"Heading1\"/.test(para);
    const isH2 = /w:pStyle w:val=\"Heading2\"/.test(para);
    const isList = /w:pStyle w:val=\"ListBullet\"/.test(para);
    if (!texts.trim()) {
      out += '\n';
      continue;
    }
    if (isH1) out += `\n# ${texts}\n`;
    else if (isH2) out += `\n## ${texts}\n`;
    else if (isList) out += `- ${texts}\n`;
    else out += `${texts}\n`;
  }
  return out;
}

function extractPdfText(pdfPath) {
  const txt = execFileSync('pdftotext', ['-layout', pdfPath, '-']).toString('utf-8');
  return txt;
}

const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/convert-corpus-sources.mjs <corpus-dir>');
  process.exit(1);
}

const absTarget = join(root, target);
const files = await walk(absTarget);

let converted = 0;
for (const f of files) {
  const lower = f.toLowerCase();
  let text = null;
  if (lower.endsWith('.docx')) {
    try {
      text = extractDocxText(f);
    } catch (e) {
      console.error(`FAIL docx ${f}: ${e.message}`);
      continue;
    }
  } else if (lower.endsWith('.pdf')) {
    try {
      text = extractPdfText(f);
    } catch (e) {
      console.error(`FAIL pdf ${f}: ${e.message}`);
      continue;
    }
  }
  if (text === null) continue;
  // Replace problematic characters in filename
  const base = basename(f).replace(/\.(docx|pdf)$/i, '.md');
  const outPath = join(dirname(f), base);
  await writeFile(outPath, text, 'utf-8');
  await unlink(f);
  console.log(`OK: ${basename(f)} -> ${base} (${text.length} chars)`);
  converted++;
}

console.log(`\nconverted ${converted} files in ${absTarget}`);
