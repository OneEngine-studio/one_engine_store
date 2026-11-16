import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { zipEntryNames, zipHasExecutable } from '../src/zip.js';

const dir = mkdtempSync(join(tmpdir(), 'oe-zip-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

/** A minimal stored (uncompressed) zip: local headers, then the central directory, then the end record. */
function makeZip(files: Record<string, string>, comment = ''): string {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const nameBuf = Buffer.from(name, 'utf8');
    const data = Buffer.from(text, 'utf8');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    locals.push(local, nameBuf, data);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const dirBuf = Buffer.concat(centrals);
  const commentBuf = Buffer.from(comment, 'utf8');
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(dirBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(commentBuf.length, 20);
  const file = join(dir, `z${Math.random().toString(36).slice(2)}.zip`);
  writeFileSync(file, Buffer.concat([...locals, dirBuf, end, commentBuf]));
  return file;
}

describe('zip listing', () => {
  it('lists every entry from the central directory', () => {
    const file = makeZip({ 'Game.exe': 'MZ', 'Game_Data/level0': 'x', 'UnityPlayer.dll': 'y' });
    expect(zipEntryNames(file)).toEqual(['Game.exe', 'Game_Data/level0', 'UnityPlayer.dll']);
  });

  it('finds the end record behind an archive comment', () => {
    const file = makeZip({ 'Game.exe': 'MZ' }, 'built by the release pipeline');
    expect(zipEntryNames(file)).toEqual(['Game.exe']);
  });

  it('refuses a file that is not a zip', () => {
    const file = join(dir, 'not.zip');
    writeFileSync(file, 'definitely not a zip archive');
    expect(() => zipEntryNames(file)).toThrow(/Not a zip/);
  });
});

describe('executable check', () => {
  it('accepts the executable at the top level', () => {
    expect(zipHasExecutable(['Railbound.exe', 'Railbound_Data/x'], 'Railbound.exe')).toBe(true);
  });

  it('accepts one wrapping folder, ignoring letter case', () => {
    expect(zipHasExecutable(['RAILBOUND/Railbound.exe', 'RAILBOUND/UnityPlayer.dll'], 'railbound.exe')).toBe(true);
  });

  it('refuses a missing executable or one nested two folders deep', () => {
    expect(zipHasExecutable(['Railbound_Data/x'], 'Railbound.exe')).toBe(false);
    expect(zipHasExecutable(['A/B/Railbound.exe'], 'Railbound.exe')).toBe(false);
    expect(zipHasExecutable(['A/Railbound.exe', 'B/readme.txt'], 'Railbound.exe')).toBe(false);
  });
});
