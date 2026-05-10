import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const projectRoot = join(__dirname, '..', '..');

function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(join(projectRoot, path), 'utf8')) as T;
}

type EasConfig = {
  cli?: {
    version?: string;
    appVersionSource?: string;
  };
  build?: Record<string, {
    developmentClient?: boolean;
    distribution?: string;
    autoIncrement?: boolean;
    android?: {
      buildType?: string;
    };
    ios?: {
      simulator?: boolean;
    };
  }>;
  submit?: Record<string, unknown>;
};

test('EAS config defines development, preview, and production profiles', () => {
  const config = readJsonFile<EasConfig>('eas.json');

  assert.equal(config.cli?.appVersionSource, 'local');
  assert.equal(config.build?.development?.developmentClient, true);
  assert.equal(config.build?.development?.distribution, 'internal');
  assert.equal(config.build?.development?.android?.buildType, 'apk');
  assert.equal(config.build?.development?.ios?.simulator, true);
  assert.equal(config.build?.preview?.distribution, 'internal');
  assert.equal(config.build?.preview?.android?.buildType, 'apk');
  assert.equal(config.build?.production?.autoIncrement, true);
  assert.ok(config.submit?.production);
});
