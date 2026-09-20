import { describe, expect, it } from 'vitest';
import {
  SCREENS,
  TYPE_VIEWPORT_ID,
  VIEWPORTS,
  fileName,
  plan,
  routeUrl,
  type Screen,
  type Viewport,
} from './screens.js';

function screenById(id: string): Screen {
  const found = SCREENS.find((screen) => screen.id === id);
  if (!found) throw new Error(`No screen named ${id}`);
  return found;
}

function viewportById(id: string): Viewport {
  const found = VIEWPORTS.find((viewport) => viewport.id === id);
  if (!found) throw new Error(`No viewport named ${id}`);
  return found;
}

describe('the Phase 1 capture plan', () => {
  it('covers the three widths §10 names', () => {
    expect(VIEWPORTS.map((v) => `${v.width}x${v.height}`)).toEqual([
      '360x640',
      '390x844',
      '430x932',
    ]);
  });

  it('marks exactly the four mockup screens as reference screens', () => {
    expect(SCREENS.filter((s) => s.reference).map((s) => s.id)).toEqual([
      'today',
      'profile',
      'prepare',
      'player',
    ]);
  });

  it('captures every screen at every width, plus the reference screens at 130%', () => {
    const shots = plan();

    expect(shots.filter((s) => s.fontScale === 1)).toHaveLength(SCREENS.length * VIEWPORTS.length);
    expect(shots.filter((s) => s.fontScale === 1.3)).toHaveLength(
      SCREENS.filter((s) => s.reference).length,
    );
    expect(
      shots.filter((s) => s.fontScale === 1.3).every((s) => s.viewport.id === TYPE_VIEWPORT_ID),
    ).toBe(true);
  });

  it('gives every shot its own file name', () => {
    const files = plan().map((s) => s.file);
    expect(new Set(files).size).toBe(files.length);
  });

  it('names files by screen, size and type scale', () => {
    const viewport = viewportById('360x640');
    const screen = screenById('today');

    expect(fileName(screen, viewport, 1)).toBe('today-360x640.png');
    expect(fileName(screen, viewport, 1.3)).toBe('today-360x640-type130.png');
  });

  it('asks for the dev-only font scale override only when it is scaling', () => {
    const screen = screenById('profile');

    expect(routeUrl('http://localhost:8081', screen, 1)).toBe('http://localhost:8081/profile');
    expect(routeUrl('http://localhost:8081', screen, 1.3)).toBe(
      'http://localhost:8081/profile?fontScale=1.3',
    );
  });
});
