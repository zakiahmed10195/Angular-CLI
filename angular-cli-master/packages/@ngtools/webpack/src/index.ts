// @ignoreDep typescript
import { satisfies } from 'semver';

// Test if typescript is available. This is a hack. We should be using peerDependencies instead
// but can't until we split global and local packages.
// See https://github.com/angular/angular-cli/issues/8107#issuecomment-338185872
try {
  const version = require('typescript').version;
  if (!satisfies(version, '^2.0.2')) {
    throw new Error();
  }
} catch (e) {
  throw new Error('Could not find local "typescript" package.'
    + 'The "@ngtools/webpack" package requires a local "typescript@^2.0.2" package to be installed.'
    + e);
}

export * from './plugin';
export * from './angular_compiler_plugin';
export * from './extract_i18n_plugin';
export { ngcLoader as default } from './loader';
export { PathsPlugin } from './paths-plugin';
