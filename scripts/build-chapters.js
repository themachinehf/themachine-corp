#!/usr/bin/env node
/**
 * THEMACHINE Chapter Builder
 * Reads .md files from /chapters/ directory
 * Generates static HTML pages
 * Run: npm run build
 */

const fs = require('fs');
const path = require('path');

const CHAPTERS_DIR = path.join(__dirname, '..', 'chapters');
const OUTPUT_DIR = path.join(__dirname, '..');
const SITE_NAME = 'THEMATHINK';
const SITE_URL = 'https://themachine-corp.pages.dev';

// Read all .md files from chapters/
function getChapterFiles() {
  if (!fs.existsSync(CHAPTERS_DIR)) {
    fs.mkdirSync(CHAPTERS_DIR, { recursive: true });
    return [];
  }
  return fs.readdirSync(CHAPTERS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();
}

// Very simple markdown to HTML converter
function mdToHtml(md) {
  let html = md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr>')
    // Paragraphs (double newlines)
    .replace(/\n\n+/g, '</p><p>')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br>');
  
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');
  
  return html;
}

// Parse frontmatter: ---key: value---
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  
  const meta = {};
  match[1].split('\n').forEach(line => {
    const [key, ...vals] = line.split(':');
    if (key && vals.length) {
      meta[key.trim()] = vals.join(':').trim();
    }
  });
  
  return { meta, body: match[2] };
}

// Generate index page listing all chapters
function generateIndexPage(chapters) {
  const items = chapters.map(ch => {
    const date = ch.meta.date || '';
    const tag = ch.meta.tag || '';
    return `<article class="chapter-item">
      <a href="/chapter/${ch.slug}" class="chapter-link">
        <span class="chapter-num">${ch.meta.num || ''}</span>
        <span class="chapter-title">${ch.meta.title || ch.slug}</span>
        <span class="chapter-date">${date}</span>
      </a>
      ${tag ? `<span class="chapter-tag">${tag}</span>` : ''}
    </article>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SITE_NAME} — Chapters</title>
  <style>
    :root { --bg:#0d0d12; --gold:#d4af37; --cyan:#00ffff; --text:#e5e7eb; --border:#1e293b; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:var(--bg); color:var(--text); font-family:monospace; min-height:100vh; }
    .nav { display:flex; align-items:center; padding:15px 20px; border-bottom:2px solid var(--cyan); }
    .nav a { color:var(--gold); text-decoration:none; font-size:14px; font-weight:bold; }
    .nav a:hover { text-decoration:underline; }
    .container { max-width:700px; margin:0 auto; padding:40px 20px; }
    h1 { color:var(--gold); font-size:20px; margin-bottom:30px; text-align:center; }
    .chapter-item { border:1px solid var(--border); margin-bottom:12px; border-radius:4px; overflow:hidden; }
    .chapter-link { display:flex; align-items:center; gap:15px; padding:16px 20px; text-decoration:none; color:var(--text); transition:all 0.2s; }
    .chapter-link:hover { border-color:var(--gold); background:rgba(212,175,55,0.05); }
    .chapter-num { color:var(--gold); font-size:11px; min-width:30px; }
    .chapter-title { flex:1; font-size:13px; }
    .chapter-date { color:#666; font-size:11px; }
    .chapter-tag { display:block; padding:8px 20px 16px; font-size:11px; color:#888; }
    .empty { text-align:center; color:#666; padding:60px 0; }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="/">← THEMACHINE CORP</a>
  </nav>
  <div class="container">
    <h1>${SITE_NAME}</h1>
    ${chapters.length ? items : '<p class="empty">No chapters yet. Stay tuned.</p>'}
  </div>
</body>
</html>`;
}

// Generate single chapter page
function generateChapterPage(chapter) {
  const content = mdToHtml(chapter.body);
  const title = chapter.meta.title || chapter.slug;
  const date = chapter.meta.date || '';
  const num = chapter.meta.num || '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — ${SITE_NAME}</title>
  <meta property="og:title" content="${title} — ${SITE_NAME}">
  <meta property="og:description" content="${chapter.meta.excerpt || title}">
  ${chapter.meta.image ? `<meta property="og:image" content="${chapter.meta.image}">` : ''}
  <style>
    :root { --bg:#0d0d12; --gold:#d4af37; --cyan:#00ffff; --text:#e5e7eb; --border:#1e293b; --muted:#666; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:var(--bg); color:var(--text); font-family:monospace; line-height:1.7; font-size:15px; }
    .nav { display:flex; align-items:center; padding:15px 20px; border-bottom:2px solid var(--border); }
    .nav a { color:var(--gold); text-decoration:none; font-size:13px; }
    .nav a:hover { text-decoration:underline; }
    .container { max-width:680px; margin:0 auto; padding:50px 20px; }
    .chapter-meta { display:flex; align-items:center; gap:15px; margin-bottom:30px; font-size:11px; color:#666; }
    .chapter-num { color:var(--gold); }
    .chapter-date { }
    h1 { color:var(--gold); font-size:clamp(18px,4vw,24px); margin-bottom:35px; line-height:1.3; }
    .content h2 { color:var(--gold); font-size:16px; margin:35px 0 15px; }
    .content h3 { color:var(--text); font-size:14px; margin:25px 0 10px; }
    .content p { margin-bottom:18px; }
    .content blockquote { border-left:3px solid var(--gold); padding:10px 20px; background:rgba(212,175,55,0.05); margin:20px 0; font-style:italic; color:#aaa; }
    .content pre { background:#111; border:1px solid var(--border); padding:16px; overflow-x:auto; margin:20px 0; font-size:13px; }
    .content code { font-family:'Courier New',monospace; }
    .content ul { padding-left:25px; margin-bottom:18px; }
    .content li { margin-bottom:6px; }
    .content hr { border:none; border-top:1px solid var(--border); margin:30px 0; }
    a { color:var(--cyan); }
    .back-link { display:inline-block; margin-top:40px; color:var(--gold); text-decoration:none; font-size:12px; }
    .back-link:hover { text-decoration:underline; }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="/chapters/">← All Chapters</a>
  </nav>
  <div class="container">
    <div class="chapter-meta">
      ${num ? `<span class="chapter-num">Chapter ${num}</span>` : ''}
      ${date ? `<span class="chapter-date">${date}</span>` : ''}
    </div>
    <h1>${title}</h1>
    <div class="content">${content}</div>
    <a href="/chapters/" class="back-link">← Back to all chapters</a>
  </div>
</body>
</html>`;
}

// Main build
function build() {
  const files = getChapterFiles();
  console.log(`Building ${files.length} chapters...`);
  
  const chapters = files.map(file => {
    const slug = file.replace('.md', '');
    const raw = fs.readFileSync(path.join(CHAPTERS_DIR, file), 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    return { slug, meta, body };
  });
  
  // Generate chapter HTML files
  chapters.forEach(ch => {
    const chapterDir = path.join(OUTPUT_DIR, 'chapter', ch.slug);
    fs.mkdirSync(chapterDir, { recursive: true });
    
    const html = generateChapterPage(ch);
    fs.writeFileSync(path.join(chapterDir, 'index.html'), html);
    console.log(`  ✓ /chapter/${ch.slug}/index.html`);
  });
  
  // Generate /chapters/ index
  fs.mkdirSync(path.join(OUTPUT_DIR, 'chapters'), { recursive: true });
  const indexHtml = generateIndexPage(chapters);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'chapters', 'index.html'), indexHtml);
  console.log(`  ✓ /chapters/index.html`);
  
  console.log('Build complete!');
}

build();
