import { ext } from "./api.js";

/** session when available (background); local fallback for content-script contexts. */
export function storageArea() {
  return ext.storage?.session ?? ext.storage?.local;
}

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    ext.runtime.sendMessage(message, (response) => {
      const err = ext.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve(response);
    });
  });
}

/** Pending state lives in the background — reliable in Firefox content scripts. */
export async function pendingGet() {
  const response = await sendMessage({ action: "pendingGet" });
  return response?.pending ?? null;
}

export async function pendingSet(pending) {
  await sendMessage({ action: "pendingSet", pending });
}

export async function pendingClear() {
  await sendMessage({ action: "pendingClear" });
}
