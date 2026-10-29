import { describe, expect, it } from 'vitest';
import { filterBounds, filterSchema } from './operations-schema';

describe('filtros do painel de respostas', () => {
  it('accepts the supported channel and NPS profile filters', () => {
    expect(filterSchema.parse({channel:'whatsapp'}).channel).toBe('whatsapp');
    expect(filterSchema.parse({sentiment:'promoter'}).sentiment).toBe('promoter');
    expect(filterSchema.parse({sentiment:'passive'}).sentiment).toBe('passive');
    expect(filterSchema.parse({sentiment:'detractor'}).sentiment).toBe('detractor');
  });

  it('rejects unsupported channel values through the safe schema fallback', () => {
    expect(filterSchema.parse({channel:'telegram'}).channel).toBeUndefined();
  });

  it('turns a selected month into a half-open UTC range', () => {
    const filters = filterSchema.parse({month:'2026-09', period:'all'});
    const bounds = filterBounds(filters, new Date('2026-10-29T12:00:00.000Z'));
    expect(bounds.since).toBe('2026-09-01T00:00:00.000Z');
    expect(bounds.until).toBe('2026-10-01T00:00:00.000Z');
  });

  it('prefers an exact month even if a rolling period is present', () => {
    const filters = filterSchema.parse({month:'2026-02', period:'7'});
    const bounds = filterBounds(filters, new Date('2026-10-29T12:00:00.000Z'));
    expect(bounds.since).toBe('2026-02-01T00:00:00.000Z');
    expect(bounds.until).toBe('2026-03-01T00:00:00.000Z');
  });

  it('does not apply date bounds when all history is selected', () => {
    const bounds = filterBounds(filterSchema.parse({period:'all'}), new Date('2026-10-29T12:00:00.000Z'));
    expect(bounds.since).toBeNull();
    expect(bounds.until).toBeNull();
  });
});
