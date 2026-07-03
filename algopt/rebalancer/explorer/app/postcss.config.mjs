import {createRequire} from 'module';

const require = createRequire(import.meta.url);

// Internal-build detection — mirrors next.config.ts. The OSS export strips
// @nest/* and the nest/libs/eps source, so resolvability of @nest/next-core (or
// an explicit NEST_INTERNAL=1) is the signal that this is the internal build.
function detectInternal() {
  if (process.env.NEST_INTERNAL === '1') {
    return true;
  }
  try {
    require.resolve('@nest/next-core');
    return true;
  } catch {
    return false;
  }
}

const isInternal = detectInternal();

// Internal-only: inject the EPS (Metamate chat) styles + Tailwind source scan
// into globals.css. These reference @nest/eps and nest/libs/eps, which don't
// exist in the OSS export, so they're added here at build time rather than
// committed in the shipped globals.css. Mirrors the @platform/* seam.
const injectEpsStyles = {
  postcssPlugin: 'inject-eps-styles-internal',
  Once(root, {atRule}) {
    const file = root.source?.input?.file ?? '';
    // Scope strictly to this app's own stylesheet. A bare endsWith('globals.css')
    // would also match the many other globals.css files across the monorepo.
    if (!file.endsWith('/app/globals.css')) {
      return;
    }
    const tailwind = root.nodes.find(
      node =>
        node.type === 'atrule' &&
        node.name === 'import' &&
        /tailwindcss/.test(node.params),
    );
    const source = atRule({
      name: 'source',
      params: '"../../../libs/eps/src/**/*.{ts,tsx}"',
    });
    const epsImport = atRule({name: 'import', params: '"@nest/eps/styles"'});
    if (tailwind) {
      tailwind.after(source);
      source.after(epsImport);
    } else {
      root.prepend(epsImport);
      root.prepend(source);
    }
  },
};

const config = {
  plugins: isInternal
    ? [injectEpsStyles, '@tailwindcss/postcss']
    : ['@tailwindcss/postcss'],
};

export default config;
