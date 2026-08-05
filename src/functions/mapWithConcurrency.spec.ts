import { describe, expect, it, vi } from "vitest";
import { mapWithConcurrency } from "./mapWithConcurrency.js";

describe("mapWithConcurrency", () => {
  it("returns empty array for empty input", async () => {
    const mapper = vi.fn();
    await expect(mapWithConcurrency([], 3, mapper)).resolves.toEqual([]);
    expect(mapper).not.toHaveBeenCalled();
  });

  it("preserves order with concurrency 1", async () => {
    const result = await mapWithConcurrency([1, 2, 3], 1, async (n) => n * 10);
    expect(result).toEqual([10, 20, 30]);
  });

  it("caps concurrent in-flight work", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const result = await mapWithConcurrency(
      [1, 2, 3, 4, 5],
      2,
      async (n) => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 20));
        inFlight--;
        return n;
      }
    );

    expect(result).toEqual([1, 2, 3, 4, 5]);
    expect(maxInFlight).toBeLessThanOrEqual(2);
  });

  it("treats non-positive concurrency as 1", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    await mapWithConcurrency([1, 2, 3], 0, async (n) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 10));
      inFlight--;
      return n;
    });

    expect(maxInFlight).toBe(1);
  });
});
