// tslint:disable:max-line-length
import * as fs from 'fs-extra';
import * as path from 'path';
import { ng } from '../helpers';

const tmp = require('../helpers/tmp');


describe('Acceptance: ng new', function () {
  let originalTimeout: number;

  beforeEach((done) => {
    // Increase timeout for these tests only.
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    spyOn(console, 'error');
    // symlink custom collections to node_modules, so we can use with ng new
    // it is a bit dirty, but bootstrap-local tricks won't work here
    fs.symlinkSync(`${process.cwd()}/tests/collections/@custom`, `./node_modules/@custom`, 'dir');

    tmp.setup('./tmp')
      .then(() => process.chdir('./tmp'))
      .then(() => done());
  }, 10000);

  afterEach((done) => {
    fs.unlinkSync(path.join(__dirname, '/../../node_modules/@custom'));
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    tmp.teardown('./tmp').then(() => done());
  });

  it('requires a valid name (!)', (done) => {
    return ng(['new', '!', '--skip-install', '--skip-git', '--inline-template'])
      .then(() => done.fail(), () => done());
  });
  it('requires a valid name (abc-.)', (done) => {
    return ng(['new', 'abc-.', '--skip-install', '--skip-git', '--inline-template'])
      .then(() => done.fail(), () => done());
  });
  it('requires a valid name (abc-)', (done) => {
    return ng(['new', 'abc-', '--skip-install', '--skip-git', '--inline-template'])
      .then(() => done.fail(), () => done());
  });
  it('requires a valid name (abc-def-)', (done) => {
    return ng(['new', 'abc-def-', '--skip-install', '--skip-git', '--inline-template'])
      .then(() => done.fail(), () => done());
  });
  it('requires a valid name (abc-123)', (done) => {
    return ng(['new', 'abc-123', '--skip-install', '--skip-git', '--inline-template'])
      .then(() => done.fail(), () => done());
  });
  it('requires a valid name (abc)', (done) => {
    return ng(['new', 'abc', '--skip-install', '--skip-git', '--inline-template'])
      .then(() => done(), () => done.fail());
  });
  it('requires a valid name (abc-def)', (done) => {
    return ng(['new', 'abc-def', '--skip-install', '--skip-git', '--inline-template'])
      .then(() => done(), () => done.fail());
  });

  it('ng new foo, where foo does not yet exist, works', (done) => {
    return ng(['new', 'foo', '--skip-install'])
      .then(() => {
        expect(fs.pathExistsSync('../foo'));
        expect(fs.pathExistsSync('package.json'));
      })
      .then(done, done.fail);
  });

  it('ng new with empty app does throw exception', (done) => {
    return ng(['new', ''])
      .then(() => done.fail(), () => done());
  });

  it('ng new without app name does throw exception', (done) => {
    return ng(['new'])
      .then(() => done.fail(), () => done());
  });

  it('ng new with app name creates new directory and has a dasherized package name', (done) => {
    return ng(['new', 'FooApp', '--skip-install', '--skip-git']).then(() => {
      expect(!fs.pathExistsSync('FooApp'));

      const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      expect(pkgJson.name).toBe('foo-app');
    })
    .then(done, done.fail);
  });

  it('ng new has a .editorconfig file', (done) => {
    return ng(['new', 'FooApp', '--skip-install', '--skip-git']).then(() => {
      expect(!fs.pathExistsSync('FooApp'));

      const editorConfig = fs.readFileSync('.editorconfig', 'utf8');
      expect(editorConfig).toBeDefined();
    })
    .then(done, done.fail);
  });

  it('Cannot run ng new, inside of Angular CLI project', (done) => {
    return ng(['new', 'foo', '--skip-install', '--skip-git'])
      .then(() => {
        return ng(['new', 'foo', '--skip-install', '--skip-git']).then(() => {
          done.fail();
        }, () => {
          expect(!fs.pathExistsSync('foo'));
        });
      })
      .then(done, done.fail);
  });

  it('ng new without skip-git flag creates .git dir', (done) => {
    return ng(['new', 'foo', '--skip-install']).then(() => {
      expect(fs.pathExistsSync('.git'));
    })
    .then(done, done.fail);
  });

  it('ng new with --dry-run does not create new directory', (done) => {
    return ng(['new', 'foo', '--dry-run']).then(() => {
      const cwd = process.cwd();
      expect(cwd).not.toMatch(/foo/, 'does not change cwd to foo in a dry run');
      expect(fs.pathExistsSync(path.join(cwd, 'foo'))).toBe(false, 'does not create new directory');
      expect(fs.pathExistsSync(path.join(cwd, '.git'))).toBe(false, 'does not create git in current directory');
    })
    .then(done, done.fail);
  });

  it('ng new with --directory uses given directory name and has correct package name', (done) => {
    return ng(['new', 'foo', '--skip-install', '--skip-git', '--directory=bar'])
      .then(() => {
        const cwd = process.cwd();
        expect(cwd).not.toMatch(/foo/, 'does not use app name for directory name');
        expect(fs.pathExistsSync(path.join(cwd, 'foo'))).toBe(false, 'does not create new directory with app name');

        expect(cwd).toMatch(/bar/, 'uses given directory name');
        expect(fs.pathExistsSync(path.join(cwd, '..', 'bar'))).toBe(true, 'creates new directory with specified name');

        const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        expect(pkgJson.name).toBe('foo', 'uses app name for package name');
      })
      .then(done, done.fail);
  });

  it('ng new --inline-template does not generate a template file', (done) => {
    return ng(['new', 'foo', '--skip-install', '--skip-git', '--inline-template'])
      .then(() => {
        const templateFile = path.join('src', 'app', 'app.component.html');
        expect(fs.pathExistsSync(templateFile)).toBe(false);
      })
      .then(done, done.fail);
  });

  it('ng new --inline-style does not gener a style file', (done) => {
    return ng(['new', 'foo', '--skip-install', '--skip-git', '--inline-style'])
      .then(() => {
        const styleFile = path.join('src', 'app', 'app.component.css');
        expect(fs.pathExistsSync(styleFile)).toBe(false);
      })
      .then(done, done.fail);
  });

  it('should skip spec files when passed --skip-tests', (done) => {
    return ng(['new', 'foo', '--skip-install', '--skip-git', '--skip-tests'])
      .then(() => {
        const specFile = path.join('src', 'app', 'app.component.spec.ts');
        expect(fs.pathExistsSync(specFile)).toBe(false);
      })
      .then(done, done.fail);
  });

  it('should specify a version of the CLI', (done) => {
    return ng(['new', 'FooApp', '--skip-install', '--skip-git']).then(() => {
      const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      expect(pkgJson.devDependencies['@angular/cli']).toMatch(/\d+\.\d+\.\d+/);
    })
    .then(done, done.fail);
  });

  it('should support passing a custom collection', (done) => {
    return ng(['new', 'foo', '--collection=@custom/application', '--skip-install', '--skip-git']).then(() => {
      expect(() => fs.readFileSync('emptyapp', 'utf8')).not.toThrow();
    })
    .then(done, done.fail);
  });
});
