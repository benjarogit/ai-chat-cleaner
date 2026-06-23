export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function report(onProgress, payload) {
  onProgress?.(payload);
}

export async function tryMethods(methods, ctx) {
  const errors = [];
  const startAt = ctx.step ?? null;

  for (const { name, fn, step } of methods) {
    if (startAt && step !== startAt) continue;

    try {
      const result = await fn(ctx);
      return { ...result, method: name };
    } catch (error) {
      if (error.name === "NavigationResumeError") throw error;
      errors.push(`${name}: ${error.message}`);
    }
  }

  if (startAt) {
    throw new Error(`Resume step "${startAt}" failed`);
  }
  throw new Error(errors.join(" | "));
}

/** Reject if more than maxRemaining items still exist after a delete attempt. */
export async function assertRemaining(countFn, maxRemaining = 0, label = "chats") {
  const remaining = await countFn();
  if (remaining > maxRemaining) {
    throw new Error(`${remaining} ${label} still remain after delete`);
  }
  return remaining;
}

export async function runDeleteLoop({
  ids,
  deleteOne,
  onProgress,
  delayMs = 300,
  label = "item",
}) {
  if (ids.length === 0) {
    return { deleted: 0, total: 0 };
  }

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const overall = 10 + ((i + 1) / ids.length) * 90;

    report(onProgress, {
      type: "status",
      message: `Deleting ${label} ${i + 1} of ${ids.length}…`,
      overall,
      current: 50,
      index: i + 1,
      total: ids.length,
      deleted: i,
    });

    await deleteOne(id);

    report(onProgress, {
      type: "status",
      message: `Deleted ${i + 1} of ${ids.length}`,
      overall,
      current: 100,
      index: i + 1,
      total: ids.length,
      deleted: i + 1,
    });

    if (delayMs > 0 && i < ids.length - 1) {
      await sleep(delayMs);
    }
  }

  return { deleted: ids.length, total: ids.length };
}
