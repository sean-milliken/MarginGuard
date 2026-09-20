import OpenAI from "openai";
import * as nvidia from "./nvidia";
import { analyzeArticle } from "../analyze";

afterEach(() => jest.restoreAllMocks());
function fakeClient(create: jest.Mock): OpenAI {
  return {
    timeout: 25000,
    chat: { completions: { create } },
  } as unknown as OpenAI;
}
test("an expired request budget prevents another transport call", async () => {
  jest.spyOn(Date, "now").mockReturnValue(100);
  const create = jest.fn();
  const result = await nvidia.callNvidiaApi(
    fakeClient(create),
    "model",
    [],
    1,
    99,
  );
  expect(result.success).toBe(false);
  expect(create).not.toHaveBeenCalled();
});
test("the SDK transport timeout is bounded by the remaining budget", async () => {
  jest.spyOn(Date, "now").mockReturnValue(100);
  const create = jest
    .fn()
    .mockResolvedValue({ choices: [{ message: { content: "ok" } }] });
  expect(
    (await nvidia.callNvidiaApi(fakeClient(create), "model", [], 1, 150))
      .success,
  ).toBe(true);
  expect(create.mock.calls[0][1]).toEqual({ timeout: 50 });
});
test("a caller can cap generated qualitative JSON without changing the model input", async () => {
  const create = jest
    .fn()
    .mockResolvedValue({ choices: [{ message: { content: "ok" } }] });
  await nvidia.callNvidiaApi(fakeClient(create), "model", [], 1, undefined, 1200);
  expect(create.mock.calls[0][0].max_tokens).toBe(1200);
});
test("schema correction shares the original deadline instead of getting a new budget", async () => {
  let now = 0;
  jest.spyOn(Date, "now").mockImplementation(() => now);
  const create = jest.fn().mockImplementation(async () => {
    now = 26000;
    return { choices: [{ message: { content: "invalid JSON" } }] };
  });
  jest.spyOn(nvidia, "createNvidiaClient").mockReturnValue(fakeClient(create));
  const result = await analyzeArticle(
    { articleText: "A freight terminal has closed." },
    { totalTimeoutMs: 25000, maxAttempts: 1 },
  );
  expect(result.success).toBe(false);
  expect(result.retried).toBe(true);
  expect(create).toHaveBeenCalledTimes(1);
  if (!result.success) expect(result.error.message).toContain("timed out");
});
