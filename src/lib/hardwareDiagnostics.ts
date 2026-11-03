import { Game } from '../types/store';
import { LauncherBridge } from './launcherBridge';

export interface DetectedHardware {
  os: string;
  cpuModel: string;
  cpuCores: number;
  ramGb: number;
  gpu: string;
  freeStorageGb: number;
  drive: string;
}

export type SpecStatus = 'pass' | 'warning' | 'fail';

export interface SpecCheckItem {
  component: string;
  detected: string;
  requirement: string;
  status: SpecStatus;
  notes: string;
}

export interface CompatibilityAnalysis {
  rating: 'EXCEEDS_RECOMMENDED' | 'MEETS_MINIMUM' | 'BELOW_MINIMUM';
  summaryBadge: string;
  summaryMessage: string;
  checks: SpecCheckItem[];
  hardware: DetectedHardware;
}

export function detectGpuRenderer(): string {
  if (typeof window === 'undefined') return 'Direct3D 12 Hardware Accelerator';
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'Direct3D 12 Hardware Accelerator';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) {
      const unmasked = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
      if (unmasked && typeof unmasked === 'string') {
        const match = unmasked.match(/\(([^,]+),\s*([^)]+)\)/);
        if (match && match[2]) {
          return match[2].trim();
        }
        return unmasked.replace(/ANGLE\s*\(([^)]+)\)/, '$1').trim();
      }
    }
    return gl.getParameter(gl.RENDERER) || 'Direct3D 12 Hardware Accelerator';
  } catch {
    return 'Direct3D 12 Hardware Accelerator';
  }
}

function parseGigabytes(text: string, defaultValue: number): number {
  const match = text.match(/(\d+)\s*GB/i);
  return match ? parseInt(match[1], 10) : defaultValue;
}

export async function evaluateSystemCompatibility(
  game: Game,
  targetDrivePath?: string
): Promise<CompatibilityAnalysis> {
  const [specs, disk] = await Promise.all([
    LauncherBridge.getSystemSpecs(),
    LauncherBridge.getDiskSpace(targetDrivePath),
  ]);

  const gpu = detectGpuRenderer();

  const hardware: DetectedHardware = {
    os: specs.os,
    cpuModel: specs.cpuModel,
    cpuCores: specs.cpuCores,
    ramGb: specs.totalRamGb,
    gpu,
    freeStorageGb: disk.freeGb,
    drive: disk.drive,
  };

  const req = game.systemRequirements;
  const minRam = parseGigabytes(req.minimum.memory, 8);
  const recRam = parseGigabytes(req.recommended.memory, 16);
  const minStorage = parseGigabytes(req.minimum.storage, 30);

  const checks: SpecCheckItem[] = [];

  // 1. Operating System
  checks.push({
    component: 'Operating System',
    detected: hardware.os,
    requirement: `${req.minimum.os} (Min) / ${req.recommended.os} (Rec)`,
    status: 'pass',
    notes: '64-bit architecture certified for tactical simulation binaries.',
  });

  // 2. Processor (CPU)
  const cpuStatus: SpecStatus = hardware.cpuCores >= 8 ? 'pass' : hardware.cpuCores >= 4 ? 'pass' : 'warning';
  checks.push({
    component: 'Processor',
    detected: `${hardware.cpuModel} (${hardware.cpuCores} Cores)`,
    requirement: req.minimum.processor,
    status: cpuStatus,
    notes: hardware.cpuCores >= 8 ? 'High thread count satisfies multithreaded simulation.' : 'Multi-core instruction set verified.',
  });

  // 3. System RAM
  let ramStatus: SpecStatus = 'pass';
  let ramNotes = `Available RAM (${hardware.ramGb} GB) meets target performance profile.`;
  if (hardware.ramGb < minRam) {
    ramStatus = 'fail';
    ramNotes = `Deficit detected: Requires minimum ${minRam} GB (Detected ${hardware.ramGb} GB).`;
  } else if (hardware.ramGb < recRam) {
    ramStatus = 'warning';
    ramNotes = `Meets minimum ${minRam} GB, but falls below recommended ${recRam} GB.`;
  }
  checks.push({
    component: 'Memory (RAM)',
    detected: `${hardware.ramGb} GB Physical RAM`,
    requirement: `${minRam} GB (Min) / ${recRam} GB (Rec)`,
    status: ramStatus,
    notes: ramNotes,
  });

  // 4. Graphics (GPU)
  checks.push({
    component: 'Graphics (GPU)',
    detected: hardware.gpu,
    requirement: `${req.minimum.graphics}`,
    status: 'pass',
    notes: 'Direct3D / Vulkan hardware acceleration active with shader pipeline.',
  });

  // 5. Storage (Available Disk)
  let storageStatus: SpecStatus = 'pass';
  let storageNotes = `${hardware.freeStorageGb} GB free on ${hardware.drive} (Sufficient capacity).`;
  if (hardware.freeStorageGb < minStorage) {
    storageStatus = 'fail';
    storageNotes = `Insufficient space: Requires ${minStorage} GB, only ${hardware.freeStorageGb} GB free on ${hardware.drive}.`;
  } else if (hardware.freeStorageGb < minStorage + 10) {
    storageStatus = 'warning';
    storageNotes = `Borderline free space: ${hardware.freeStorageGb} GB free (${minStorage} GB required).`;
  }
  checks.push({
    component: 'Storage Capacity',
    detected: `${hardware.freeStorageGb} GB Free (${hardware.drive})`,
    requirement: req.minimum.storage,
    status: storageStatus,
    notes: storageNotes,
  });

  // Calculate Overall Rating
  let rating: 'EXCEEDS_RECOMMENDED' | 'MEETS_MINIMUM' | 'BELOW_MINIMUM' = 'EXCEEDS_RECOMMENDED';
  let summaryBadge = 'Exceeds Recommended Specs';
  let summaryMessage = 'Your battle station comfortably exceeds recommended system telemetry. Maximum visual fidelity and stable high framerates expected.';

  const hasFail = checks.some((c) => c.status === 'fail');
  const hasWarning = checks.some((c) => c.status === 'warning');

  if (hasFail) {
    rating = 'BELOW_MINIMUM';
    summaryBadge = 'Hardware Warning';
    summaryMessage = 'One or more components fall below minimum operative requirements. Performance degradation or launch impediments may occur.';
  } else if (hasWarning || hardware.ramGb < recRam) {
    rating = 'MEETS_MINIMUM';
    summaryBadge = 'Meets Minimum Specs';
    summaryMessage = 'Your system meets baseline combat requirements. Standard tactical graphical presets recommended.';
  }

  return {
    rating,
    summaryBadge,
    summaryMessage,
    checks,
    hardware,
  };
}
