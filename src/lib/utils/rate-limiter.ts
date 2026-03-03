/**
 * Processes items in batches with a delay between batches.
 * Returns Promise.allSettled results for each batch, flattened.
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: { batchSize?: number; delayMs?: number } = {}
): Promise<PromiseSettledResult<R>[]> {
  const { batchSize = 10, delayMs = 1000 } = options;
  const allResults: PromiseSettledResult<R>[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(processor));
    allResults.push(...batchResults);

    // Delay between batches (skip after last batch)
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return allResults;
}

/** Separates Promise.allSettled results into fulfilled values and rejected errors */
export function separateResults<T>(
  results: PromiseSettledResult<T>[]
): { fulfilled: T[]; rejected: Array<{ index: number; reason: unknown }> } {
  const fulfilled: T[] = [];
  const rejected: Array<{ index: number; reason: unknown }> = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      fulfilled.push(result.value);
    } else {
      rejected.push({ index, reason: result.reason });
    }
  });

  return { fulfilled, rejected };
}
