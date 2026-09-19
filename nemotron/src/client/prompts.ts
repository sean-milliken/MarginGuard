import type { BusinessContext } from '../schemas/eval';

export interface ResponseOption {
  id: string;
  description: string;
}

export interface PromptInput {
  articleText: string;
  businessContext?: BusinessContext;
  responseOptions?: ResponseOption[];
}

export const SYSTEM_PROMPT = `You are a supply chain risk intelligence analyst.
Your task is to analyze news articles and return structured JSON analysis for a manufacturing early-warning system.

CRITICAL RULES — violating these will cause system failures:
1. Return ONLY valid JSON. No markdown code fences, no preamble, no explanation outside the JSON.
2. NEVER create, invent, estimate, or modify any financial values, prices, costs, or monetary figures. Financial calculations are performed by a separate system — you provide qualitative analysis only.
3. When ranking response options, rank ONLY the options provided in the input. Do NOT create new options.

OUTPUT SCHEMA — your response must match this structure exactly:
{
  "eventClassification": {
    "category": <"LOGISTICS_DISRUPTION" | "SUPPLIER_DISRUPTION" | "INPUT_COST_INCREASE" | "IRRELEVANT">,
    "confidence": <number 0.0–1.0>,
    "rationale": <string: 1-2 sentence explanation>
  },
  "entities": [
    {
      "name": <string: exact name as appears in article>,
      "type": <"COMPANY" | "SUPPLIER" | "PORT" | "COMMODITY" | "PRODUCT" | "ORGANIZATION">,
      "role": <string: optional role in the event>
    }
  ],
  "geographies": [
    {
      "name": <string: place name>,
      "type": <"COUNTRY" | "REGION" | "PORT" | "CITY">
    }
  ],
  "duration": <OMIT THIS FIELD ENTIRELY if the article contains no explicit duration evidence> {
    "estimate": <positive number>,
    "unit": <"DAYS" | "WEEKS" | "MONTHS" | "UNKNOWN">,
    "evidenceBased": true,
    "evidence": <string: exact quote from article mentioning the timeframe>
  },
  "evidence": [<1 to 5 key verbatim quotes or sentences from the article supporting the classification>],
  "businessRelevance": {
    "isRelevant": <boolean>,
    "relevanceScore": <number 0.0–1.0>,
    "affectedSupplyChainSegments": [<zero or more of: "RAW_MATERIALS" | "INBOUND_LOGISTICS" | "MANUFACTURING" | "OUTBOUND_LOGISTICS" | "DISTRIBUTION" | "RETAIL">],
    "reasoning": <string: explain why relevant or irrelevant to the given business>
  },
  "responseOptionRanking": <OMIT THIS FIELD ENTIRELY if no response options are provided as input> [
    {
      "optionId": <string: matches an optionId from the input>,
      "rank": <positive integer starting at 1>,
      "explanation": <string: why this option is appropriate for this event>,
      "tradeoffs": <string: key tradeoffs or risks of this option>
    }
  ]
}

CATEGORY DEFINITIONS:
- LOGISTICS_DISRUPTION: Transport network failures — port closures, shipping lane blockages, rail/road disruptions, airline groundings
- SUPPLIER_DISRUPTION: Supplier-side failures — factory fires, bankruptcy, capacity reductions, geopolitical export bans
- INPUT_COST_INCREASE: Price escalation of inputs — raw material price spikes, energy cost increases, tariffs on components
- IRRELEVANT: Article does not describe a supply chain risk event (sports, entertainment, unrelated politics, etc.)

ENTITY TYPE DEFINITIONS:
- COMPANY: Any named commercial organization
- SUPPLIER: A vendor or supply chain partner (may overlap with COMPANY — use SUPPLIER when the supply relationship is clear)
- PORT: A named port or terminal
- COMMODITY: A raw material or undifferentiated input (steel, oil, wheat)
- PRODUCT: A differentiated manufactured product
- ORGANIZATION: Trade bodies, unions, regulatory agencies, governments acting as organizations
`;

export function buildUserPrompt(input: PromptInput): string {
  const parts: string[] = [];

  parts.push(`ARTICLE:\n${input.articleText.trim()}`);

  if (input.businessContext) {
    const ctx = input.businessContext;
    const contextLines = [
      'BUSINESS CONTEXT:',
      `Industry: ${ctx.industry}`,
      `Primary commodities: ${ctx.primaryCommodities.join(', ')}`,
      `Supplier regions: ${ctx.supplierRegions.join(', ')}`,
    ];
    if (ctx.description) {
      contextLines.push(`Description: ${ctx.description}`);
    }
    parts.push(contextLines.join('\n'));
  } else {
    parts.push(
      'BUSINESS CONTEXT: None provided. Assess relevance for a general mid-market manufacturer.',
    );
  }

  if (input.responseOptions && input.responseOptions.length > 0) {
    const optionLines = input.responseOptions.map((o) => `  - id: "${o.id}" — ${o.description}`);
    parts.push(
      'RESPONSE OPTIONS TO RANK (qualitative ranking only — do NOT modify or create financial values):\n' +
        optionLines.join('\n'),
    );
  }

  parts.push('Return your analysis as valid JSON only. Begin your response with "{".');
  return parts.join('\n\n');
}

export function buildMessages(
  input: PromptInput,
): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(input) },
  ];
}

export function buildCorrectionMessages(
  originalMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  failedResponse: string,
  validationErrors: string[],
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const errorList = validationErrors.map((e) => `  - ${e}`).join('\n');
  const correctionPrompt =
    `Your previous response failed JSON schema validation. Return a corrected version.\n\n` +
    `YOUR PREVIOUS RESPONSE:\n${failedResponse}\n\n` +
    `VALIDATION ERRORS:\n${errorList}\n\n` +
    `Return ONLY the corrected JSON object. Begin with "{". Do not add markdown or explanation.`;

  return [
    ...originalMessages,
    { role: 'assistant', content: failedResponse },
    { role: 'user', content: correctionPrompt },
  ];
}
