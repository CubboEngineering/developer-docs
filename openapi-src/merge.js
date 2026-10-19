// Merge openapi.base.yaml + fragments/*.yaml into developer-docs/openapi.yaml.
// Usage: npm run build (writes ../openapi.yaml). Fails on duplicate paths/schemas, dangling $refs or missing security.
const fs = require('fs'), path = require('path'), yaml = require('js-yaml');
const S = __dirname;
const out = process.argv[2] || path.join(S, '..', 'openapi.yaml');
const base = yaml.load(fs.readFileSync(path.join(S, 'openapi.base.yaml'), 'utf8'));
base.paths = base.paths || {}; base.webhooks = base.webhooks || {};
base.components.schemas = base.components.schemas || {};
base.components.responses = base.components.responses || {}; base.components.parameters = base.components.parameters || {};
const owner = {};
let errors = [];
for (const f of fs.readdirSync(path.join(S, 'fragments')).filter(f => f.endsWith('.yaml')).sort()) {
  const frag = yaml.load(fs.readFileSync(path.join(S, 'fragments', f), 'utf8')) || {};
  for (const [p, ops] of Object.entries(frag.paths || {})) {
    if (!base.paths[p]) base.paths[p] = {};
    for (const [m, op] of Object.entries(ops)) {
      if (base.paths[p][m]) errors.push(`${f}: duplicate ${m.toUpperCase()} ${p} (also in ${owner[m+' '+p]})`);
      base.paths[p][m] = op; owner[m+' '+p] = f;
    }
  }
  for (const [n, w] of Object.entries(frag.webhooks || {})) {
    if (base.webhooks[n]) errors.push(`${f}: duplicate webhook ${n}`);
    base.webhooks[n] = w;
  }
  for (const kind of ['schemas', 'responses', 'parameters']) {
    for (const [n, s] of Object.entries((frag.components || {})[kind] || {})) {
      if (base.components[kind][n]) errors.push(`${f}: duplicate components.${kind}.${n} (also in ${owner[kind+'/'+n] || 'base'})`);
      base.components[kind][n] = s; owner[kind+'/'+n] = f;
    }
  }
}
if (!Object.keys(base.webhooks).length) delete base.webhooks;
// every operation must state its auth explicitly; a missing key silently inherits the global bearer requirement
for (const [p, ops] of Object.entries(base.paths)) for (const [m, op] of Object.entries(ops))
  if (!('security' in op)) errors.push(`${m.toUpperCase()} ${p}: no explicit security (use [] for public endpoints)`);
// dangling refs
const text = JSON.stringify(base);
const refs = new Set([...text.matchAll(/"\$ref":"#\/components\/(schemas|responses)\/([^"]+)"/g)].map(m => m[1] + '/' + m[2]));
for (const r of refs) { const [k, n] = r.split('/'); if (!base.components[k][n]) errors.push(`dangling $ref #/components/${r}`); }
// sort paths for stable diffs
base.paths = Object.fromEntries(Object.entries(base.paths).sort(([a], [b]) => a.localeCompare(b)));
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
fs.writeFileSync(out, '# Generated from controllers in platform (origin/main). Do not hand-edit endpoint pages in MDX.\n' + yaml.dump(base, { lineWidth: 110, noRefs: true, quotingType: '"' }));
const nOps = Object.values(base.paths).reduce((a, o) => a + Object.keys(o).length, 0);
console.log(`ok: ${nOps} operations, ${Object.keys(base.webhooks||{}).length} webhooks, ${Object.keys(base.components.schemas).length} schemas -> ${out}`);
