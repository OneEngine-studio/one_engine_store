// Lists the file names inside a .zip by reading only its central directory, so a 1 GB build is checked without
// unpacking it. Supports Zip64 archives. Used by the build publisher to refuse a zip that lacks its executable.
import { closeSync, fstatSync, openSync, readSync } from 'node:fs';

const EOCD = 0x06054b50;
const ZIP64_LOCATOR = 0x07064b50;
const ZIP64_EOCD = 0x06064b50;
const CENTRAL_ENTRY = 0x02014b50;

function readAt(fd: number, position: number, length: number): Buffer {
  const buf = Buffer.alloc(length);
  const n = readSync(fd, buf, 0, length, position);
  return buf.subarray(0, n);
}

export function zipEntryNames(file: string): string[] {
  const fd = openSync(file, 'r');
  try {
    const size = fstatSync(fd).size;
    // The end record sits in the last 22 bytes plus an optional comment of up to 64 KB.
    const tailLength = Math.min(size, 22 + 0xffff);
    const tailStart = size - tailLength;
    const tail = readAt(fd, tailStart, tailLength);
    let eocd = -1;
    for (let i = tail.length - 22; i >= 0; i--) {
      if (tail.readUInt32LE(i) === EOCD) {
        eocd = i;
        break;
      }
    }
    if (eocd < 0) throw new Error('Not a zip file (no end of central directory).');

    let count = tail.readUInt16LE(eocd + 10);
    let dirSize = tail.readUInt32LE(eocd + 12);
    let dirOffset = tail.readUInt32LE(eocd + 16);

    if (count === 0xffff || dirSize === 0xffffffff || dirOffset === 0xffffffff) {
      const loc = eocd - 20;
      if (loc < 0 || tail.readUInt32LE(loc) !== ZIP64_LOCATOR) throw new Error('Zip64 archive without its locator.');
      const z64Offset = Number(tail.readBigUInt64LE(loc + 8));
      const z64 = readAt(fd, z64Offset, 56);
      if (z64.readUInt32LE(0) !== ZIP64_EOCD) throw new Error('Damaged Zip64 end record.');
      count = Number(z64.readBigUInt64LE(32));
      dirSize = Number(z64.readBigUInt64LE(40));
      dirOffset = Number(z64.readBigUInt64LE(48));
    }

    const dir = readAt(fd, dirOffset, dirSize);
    const names: string[] = [];
    let p = 0;
    for (let i = 0; i < count; i++) {
      if (p + 46 > dir.length || dir.readUInt32LE(p) !== CENTRAL_ENTRY) throw new Error('Damaged zip central directory.');
      const nameLength = dir.readUInt16LE(p + 28);
      const extraLength = dir.readUInt16LE(p + 30);
      const commentLength = dir.readUInt16LE(p + 32);
      names.push(dir.subarray(p + 46, p + 46 + nameLength).toString('utf8'));
      p += 46 + nameLength + extraLength + commentLength;
    }
    return names;
  } finally {
    closeSync(fd);
  }
}

/**
 * True when the executable sits at the top of the zip, or inside one folder that wraps everything (the launcher
 * accepts both layouts).
 */
export function zipHasExecutable(names: string[], executable: string): boolean {
  const wanted = executable.toLowerCase();
  const tops = new Set(names.map((n) => n.split('/')[0]));
  if (names.some((n) => n.toLowerCase() === wanted)) return true;
  if (tops.size !== 1) return false;
  const [top] = [...tops];
  return names.some((n) => n.toLowerCase() === `${top}/${executable}`.toLowerCase());
}
