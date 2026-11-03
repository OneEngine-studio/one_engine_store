import { describe, it, expect } from 'vitest';
import { evaluateSystemCompatibility, detectGpuRenderer } from '../src/lib/hardwareDiagnostics';
import { INITIAL_GAMES } from '../src/data/mockData';

describe('hardwareDiagnostics', () => {
  it('detects a GPU renderer string', () => {
    const gpu = detectGpuRenderer();
    expect(typeof gpu).toBe('string');
    expect(gpu.length).toBeGreaterThan(0);
  });

  it('evaluates compatibility for initial games correctly', async () => {
    const game = INITIAL_GAMES[0];
    const result = await evaluateSystemCompatibility(game);

    expect(result).toBeDefined();
    expect(['EXCEEDS_RECOMMENDED', 'MEETS_MINIMUM', 'BELOW_MINIMUM']).toContain(result.rating);
    expect(result.checks.length).toBe(5);

    const components = result.checks.map((c) => c.component);
    expect(components).toContain('Operating System');
    expect(components).toContain('Processor');
    expect(components).toContain('Memory (RAM)');
    expect(components).toContain('Graphics (GPU)');
    expect(components).toContain('Storage Capacity');

    expect(result.hardware.ramGb).toBeGreaterThan(0);
    expect(result.hardware.cpuCores).toBeGreaterThan(0);
  });

  it('marks insufficient memory as fail when RAM is lower than minimum', async () => {
    const gameWithHighReq = {
      ...INITIAL_GAMES[0],
      systemRequirements: {
        minimum: {
          os: 'Windows 11',
          processor: 'Quantum Octa-Core',
          memory: '128 GB RAM',
          graphics: 'NVIDIA RTX 5090',
          storage: '10 GB',
        },
        recommended: {
          os: 'Windows 11',
          processor: 'Quantum Octa-Core',
          memory: '256 GB RAM',
          graphics: 'NVIDIA RTX 5090',
          storage: '10 GB',
        },
      },
    };

    const result = await evaluateSystemCompatibility(gameWithHighReq);
    expect(result.rating).toBe('BELOW_MINIMUM');
    const ramCheck = result.checks.find((c) => c.component === 'Memory (RAM)');
    expect(ramCheck?.status).toBe('fail');
  });
});
