import test from "node:test";
import assert from "node:assert/strict";
import { memoryCache } from "../cache";
import { createFredService } from "../service";
import { createApi } from "../../api";

test("an economic signal can be resolved and priced using its full date ID", async () => {
  const cache = memoryCache();
  const date = new Date();
  date.setUTCDate(1);
  const current = date.toISOString().slice(0, 10);
  date.setUTCMonth(date.getUTCMonth() - 1);
  const previous = date.toISOString().slice(0, 10);
  const seriesId = "PCU331315331315";
  await cache.putObservations([
    { seriesId, date: current, value: 110, cachedAt: new Date().toISOString() },
    {
      seriesId,
      date: previous,
      value: 100,
      cachedAt: new Date().toISOString(),
    },
  ]);
  const service = createFredService(null, cache);
  const signal = await service.getSignal(`${seriesId}-${current}`);
  assert.equal(signal?.date, current);
  assert.equal(signal?.percentageChange, 10);
  const api = createApi({ fredService: service });
  const response = await api({
    method: "GET",
    path: `/fred/impact/${seriesId}-${current}`,
  });
  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body)[0].monthlyImpactCents, 1200000);
  assert.equal(await service.getSignal(`${seriesId}-invalid`), null);
});
test("unconfigured FRED and failed news return visible errors instead of healthy empty data", async () => {
  const api = createApi({
    newsService: {
      async getSupplyChainNews() {
        throw new Error("upstream unavailable");
      },
    },
  });
  assert.equal(
    (await api({ method: "GET", path: "/fred/signals" })).statusCode,
    503,
  );
  assert.equal((await api({ method: "GET", path: "/news" })).statusCode, 502);
});
