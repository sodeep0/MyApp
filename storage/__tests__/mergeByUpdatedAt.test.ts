import assert from 'node:assert/strict';
import test from 'node:test';
import {
  compareUpdatedAt,
  mergeByUpdatedAt,
  pickNewerByUpdatedAt,
} from '../../repositories/firebase/mergeByUpdatedAt';

type Entity = { id: string; name: string; updatedAt?: string | null };

test('mergeByUpdatedAt prefers later updatedAt', () => {
  const local: Entity[] = [
    { id: 'a', name: 'local-a', updatedAt: '2026-07-01T10:00:00.000Z' },
    { id: 'b', name: 'local-b', updatedAt: '2026-07-02T10:00:00.000Z' },
  ];
  const remote: Entity[] = [
    { id: 'a', name: 'remote-a', updatedAt: '2026-07-01T12:00:00.000Z' },
    { id: 'b', name: 'remote-b', updatedAt: '2026-07-01T10:00:00.000Z' },
  ];

  const merged = mergeByUpdatedAt(local, remote);
  const byId = Object.fromEntries(merged.map((e) => [e.id, e]));

  assert.equal(byId.a.name, 'remote-a');
  assert.equal(byId.b.name, 'local-b');
});

test('mergeByUpdatedAt prefers remote when timestamps are equal', () => {
  const ts = '2026-07-01T10:00:00.000Z';
  const local: Entity[] = [{ id: 'a', name: 'local', updatedAt: ts }];
  const remote: Entity[] = [{ id: 'a', name: 'remote', updatedAt: ts }];

  const [winner] = mergeByUpdatedAt(local, remote);
  assert.equal(winner.name, 'remote');
});

test('mergeByUpdatedAt treats missing updatedAt as older than present', () => {
  const local: Entity[] = [{ id: 'a', name: 'local-no-ts' }];
  const remote: Entity[] = [
    { id: 'a', name: 'remote-with-ts', updatedAt: '2026-07-01T10:00:00.000Z' },
  ];

  assert.equal(mergeByUpdatedAt(local, remote)[0].name, 'remote-with-ts');
  assert.equal(mergeByUpdatedAt(remote, local)[0].name, 'remote-with-ts');
});

test('mergeByUpdatedAt prefers remote when both updatedAt are missing', () => {
  const local: Entity[] = [{ id: 'a', name: 'local' }];
  const remote: Entity[] = [{ id: 'a', name: 'remote' }];

  assert.equal(mergeByUpdatedAt(local, remote)[0].name, 'remote');
});

test('mergeByUpdatedAt unions ids from both sides', () => {
  const local: Entity[] = [
    { id: 'local-only', name: 'L', updatedAt: '2026-07-01T10:00:00.000Z' },
  ];
  const remote: Entity[] = [
    { id: 'remote-only', name: 'R', updatedAt: '2026-07-01T10:00:00.000Z' },
  ];

  const ids = mergeByUpdatedAt(local, remote).map((e) => e.id).sort();
  assert.deepEqual(ids, ['local-only', 'remote-only']);
});

test('pickNewerByUpdatedAt handles nullish sides', () => {
  const local: Entity = { id: 'a', name: 'local', updatedAt: '2026-07-01T10:00:00.000Z' };
  const remote: Entity = { id: 'a', name: 'remote', updatedAt: '2026-07-01T11:00:00.000Z' };

  assert.equal(pickNewerByUpdatedAt(null, remote)?.name, 'remote');
  assert.equal(pickNewerByUpdatedAt(local, undefined)?.name, 'local');
  assert.equal(pickNewerByUpdatedAt(null, null), null);
  assert.equal(pickNewerByUpdatedAt(local, remote)?.name, 'remote');
});

test('compareUpdatedAt ranking matches LWW rules', () => {
  assert.equal(compareUpdatedAt(null, null), 0);
  assert.ok(compareUpdatedAt('2026-07-01T10:00:00.000Z', null) > 0);
  assert.ok(compareUpdatedAt(null, '2026-07-01T10:00:00.000Z') < 0);
  assert.equal(
    compareUpdatedAt('2026-07-01T10:00:00.000Z', '2026-07-01T10:00:00.000Z'),
    0,
  );
  assert.ok(
    compareUpdatedAt('2026-07-01T12:00:00.000Z', '2026-07-01T10:00:00.000Z') > 0,
  );
});

// Soft-delete exclusion is skipped: current domain entities do not carry isDeleted.
