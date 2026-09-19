import { NemotronAnalysisResultSchema, DurationSchema } from './analysis';

const validResult = {
  eventClassification: {
    category: 'LOGISTICS_DISRUPTION',
    confidence: 0.95,
    rationale: 'Port strike halting container operations.',
  },
  entities: [
    { name: 'Port of Los Angeles', type: 'PORT' },
    { name: 'ILWU', type: 'ORGANIZATION', role: 'striking union' },
  ],
  geographies: [{ name: 'Los Angeles', type: 'CITY' }],
  evidence: ['Dock workers at the Port of Los Angeles went on strike.'],
  businessRelevance: {
    isRelevant: true,
    relevanceScore: 0.9,
    affectedSupplyChainSegments: ['INBOUND_LOGISTICS'],
    reasoning: 'Company imports components through LA ports.',
  },
};

describe('NemotronAnalysisResultSchema', () => {
  it('accepts a valid full result without duration', () => {
    expect(NemotronAnalysisResultSchema.safeParse(validResult).success).toBe(true);
  });

  it('accepts a valid result with duration', () => {
    const withDuration = {
      ...validResult,
      duration: {
        estimate: 14,
        unit: 'DAYS',
        evidenceBased: true,
        evidence: 'Expected to last at least 14 days.',
      },
    };
    expect(NemotronAnalysisResultSchema.safeParse(withDuration).success).toBe(true);
  });

  it('rejects missing eventClassification', () => {
    const { eventClassification: _removed, ...rest } = validResult as Record<string, unknown>;
    expect(NemotronAnalysisResultSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects confidence above 1.0', () => {
    const bad = {
      ...validResult,
      eventClassification: { ...validResult.eventClassification, confidence: 1.5 },
    };
    expect(NemotronAnalysisResultSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects confidence below 0', () => {
    const bad = {
      ...validResult,
      eventClassification: { ...validResult.eventClassification, confidence: -0.1 },
    };
    expect(NemotronAnalysisResultSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects evidence array with more than 5 items', () => {
    const bad = {
      ...validResult,
      evidence: ['a', 'b', 'c', 'd', 'e', 'f'],
    };
    expect(NemotronAnalysisResultSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects empty evidence array', () => {
    const bad = { ...validResult, evidence: [] };
    expect(NemotronAnalysisResultSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown event category', () => {
    const bad = {
      ...validResult,
      eventClassification: { ...validResult.eventClassification, category: 'WEATHER_EVENT' },
    };
    expect(NemotronAnalysisResultSchema.safeParse(bad).success).toBe(false);
  });
});

describe('DurationSchema', () => {
  it('rejects evidenceBased: false', () => {
    const bad = {
      estimate: 7,
      unit: 'DAYS',
      evidenceBased: false,
      evidence: 'Some evidence',
    };
    expect(DurationSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects missing evidence string', () => {
    const bad = {
      estimate: 7,
      unit: 'DAYS',
      evidenceBased: true,
    };
    expect(DurationSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects non-positive estimate', () => {
    const bad = {
      estimate: -1,
      unit: 'DAYS',
      evidenceBased: true,
      evidence: 'Seven days.',
    };
    expect(DurationSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts a valid duration', () => {
    const good = {
      estimate: 3,
      unit: 'WEEKS',
      evidenceBased: true,
      evidence: 'Expected to last three weeks.',
    };
    expect(DurationSchema.safeParse(good).success).toBe(true);
  });
});
