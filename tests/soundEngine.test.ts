import { describe, it, expect } from 'vitest';
import { playSynthesizerSound } from '../src/lib/soundEngine';

describe('soundEngine', () => {
  it('handles sound playback calls safely in node/test environment without throwing', () => {
    expect(() => playSynthesizerSound('click', true)).not.toThrow();
    expect(() => playSynthesizerSound('purchase', true)).not.toThrow();
    expect(() => playSynthesizerSound('launch', true)).not.toThrow();
    expect(() => playSynthesizerSound('alert', true)).not.toThrow();
    expect(() => playSynthesizerSound('hover', true)).not.toThrow();
    expect(() => playSynthesizerSound('click', false)).not.toThrow();
  });
});
