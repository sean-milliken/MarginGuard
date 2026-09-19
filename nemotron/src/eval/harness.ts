import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeArticle } from '../analyze';
import { EVAL_DATASET } from './dataset';
import { calculateMetrics } from './metrics';
import type { EvalResultItem, EvalResults } from '../schemas/eval';

const OUTPUT_PATH = path.join(process.cwd(), 'eval-results.json');
const INTER_REQUEST_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const modelId =
    process.env['NVIDIA_NEMOTRON_MODEL'] ?? 'nvidia/nemotron-3-super-120b-a12b';
  console.log(`Running Nemotron eval — model: ${modelId}`);
  console.log(`Dataset: ${EVAL_DATASET.length} examples\n`);

  const results: EvalResultItem[] = [];

  for (let i = 0; i < EVAL_DATASET.length; i++) {
    const item = EVAL_DATASET[i];
    if (!item) continue;
    process.stdout.write(`[${i + 1}/${EVAL_DATASET.length}] ${item.id} ... `);

    const start = Date.now();
    const outcome = await analyzeArticle({
      articleText: item.articleText,
      businessContext: item.businessContext,
    });
    const latencyMs = Date.now() - start;

    const result: EvalResultItem = {
      id: item.id,
      success: outcome.success,
      firstAttemptSchemaValid: outcome.firstAttemptSchemaValid,
      retried: outcome.retried,
      latencyMs,
      ...(outcome.success
        ? {
            predicted: outcome.result,
            classificationCorrect:
              outcome.result.eventClassification.category === item.groundTruth.eventCategory,
            relevanceCorrect:
              item.businessContext !== undefined
                ? outcome.result.businessRelevance.isRelevant === item.groundTruth.isRelevant
                : undefined,
          }
        : {
            error: outcome.error.message,
            validationErrors: outcome.error.validationErrors,
          }),
    };

    results.push(result);

    const status = outcome.success
      ? `OK${outcome.retried ? ' (retried)' : ''} [${latencyMs}ms]`
      : `FAIL: ${outcome.error.type}`;
    console.log(status);

    if (i < EVAL_DATASET.length - 1) {
      await sleep(INTER_REQUEST_DELAY_MS);
    }
  }

  const metrics = calculateMetrics(results, EVAL_DATASET);
  const evalResults: EvalResults = {
    runTimestamp: new Date().toISOString(),
    modelId,
    metrics,
    results,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(evalResults, null, 2), 'utf-8');

  console.log('\n─── EVAL RESULTS ───────────────────────────────────────');
  console.log(`Total examples:               ${metrics.totalExamples}`);
  console.log(`Successful inferences:        ${metrics.successfulInferences}`);
  console.log(`Retried (schema failure):     ${metrics.retriedCount}`);
  console.log(
    `Classification accuracy:      ${(metrics.classificationAccuracy * 100).toFixed(1)}%`,
  );
  console.log(`Relevance accuracy:           ${(metrics.relevanceAccuracy * 100).toFixed(1)}%`);
  console.log(`Entity precision:             ${(metrics.entityPrecision * 100).toFixed(1)}%`);
  console.log(`Entity recall:                ${(metrics.entityRecall * 100).toFixed(1)}%`);
  console.log(`Entity F1:                    ${(metrics.entityF1 * 100).toFixed(1)}%`);
  console.log(
    `Structured output validity:   ${(metrics.structuredOutputValidityRate * 100).toFixed(1)}%`,
  );
  console.log(`\nPer-category classification accuracy:`);
  for (const [cat, stats] of Object.entries(metrics.classificationByCategory)) {
    console.log(
      `  ${cat.padEnd(25)} ${stats.correct}/${stats.total} (${(stats.accuracy * 100).toFixed(0)}%)`,
    );
  }
  console.log(`\nResults written to: ${OUTPUT_PATH}`);
}

main().catch((err: unknown) => {
  console.error('Eval harness failed:', err);
  process.exit(1);
});
