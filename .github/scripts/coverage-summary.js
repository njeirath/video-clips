#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseLcov(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  let LF = 0; // lines found
  let LH = 0; // lines hit
  content.split('\n').forEach(line => {
    if (line.startsWith('LF:')) {
      LF += parseInt(line.slice(3), 10) || 0;
    }
    if (line.startsWith('LH:')) {
      LH += parseInt(line.slice(3), 10) || 0;
    }
  });
  const percent = LF > 0 ? (LH / LF) * 100 : null;
  return { LF, LH, percent };
}

function human(n) {
  return n === null || n === undefined ? 'N/A' : (Math.round(n * 100) / 100).toFixed(2);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: coverage-summary.js <lcov1> <lcov2> ...');
  process.exit(2);
}

const out = {};
let totalLF = 0;
let totalLH = 0;

args.forEach(p => {
  const summary = parseLcov(p);
  const project = path.basename(path.dirname(p)) || path.basename(p);
  out[project] = summary;
  if (summary) {
    totalLF += summary.LF;
    totalLH += summary.LH;
  }
});

out.total = {
  LF: totalLF,
  LH: totalLH,
  percent: totalLF > 0 ? (totalLH / totalLF) * 100 : null,
};
const mdLines = [];
mdLines.push('| Project | Lines Found | Lines Hit | Coverage % |');
mdLines.push('|---|---:|---:|---:|');
Object.keys(out).forEach(k => {
  const v = out[k];
  if (!v) {
    mdLines.push(`| ${k} | N/A | N/A | N/A |`);
  } else {
    const pct = v.percent === null ? 'N/A' : human(v.percent);
    mdLines.push(`| ${k} | ${v.LF} | ${v.LH} | ${pct}% |`);
  }
});

const md = mdLines.join('\n');

console.log(JSON.stringify(out, null, 2));
console.log('\n---\n');
console.log(md);
process.stdout.write('\n');

// Also write markdown file next to JSON for the workflow step to pick up if needed
try {
  fs.writeFileSync('coverage-summary.md', md, 'utf8');
} catch (e) {}
