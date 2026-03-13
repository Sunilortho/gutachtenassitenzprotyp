// gutachten-worker.js
// Vite-compatible ES Module Web Worker
// Uses `import` instead of `importScripts` so Vite can bundle it correctly.

import { runLocalStub } from '../models/local-stub.js';

let _cancelRequested = false;

// Placeholder for a real OpenRouter call
async function callPrimaryModel(chunk) {
  // Replace this with a real fetch() to OpenRouter when ready.
  // Currently throws to exercise the fallback chain.
  throw new Error('OpenRouter unavailable');
}

// Fallback chain runner
async function runThroughFallback(chunk, fallbackConfig) {
  let lastError;
  for (const step of (fallbackConfig?.fallbackChain || [])) {
    try {
      if (step.model === 'gemini') {
        // Simulate a Gemini call – replace with real fetch() when ready
        const res = { summary: `gemini-simulated:${chunk.slice(0, 200)}` };
        return { model: 'gemini', result: res };
      } else if (step.model === 'local-stub') {
        const res = await runLocalStub(chunk);
        return { model: 'local-stub', result: res };
      } else if (step.model.startsWith('openrouter')) {
        // Wire a real OpenRouter fetch here when ready
        throw new Error('OpenRouter not wired in worker');
      }
    } catch (err) {
      lastError = err;
      // try next step in chain
    }
  }
  throw lastError || new Error('Fallback chain exhausted');
}

async function processChunk(chunk, fallbackConfig) {
  try {
    const primary = await callPrimaryModel(chunk);
    return { model: 'primary', result: primary };
  } catch {
    return await runThroughFallback(chunk, fallbackConfig);
  }
}

// Default fallback config used when none is provided by the caller
const DEFAULT_FALLBACK_CONFIG = {
  fallbackChain: [
    { model: 'gemini' },
    { model: 'local-stub' },
  ],
};

// Entry point
self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'start') {
    _cancelRequested = false;
    const { taskId, document, fallbackConfig = DEFAULT_FALLBACK_CONFIG } = payload;

    // Chunk by blank lines; split oversized chunks at 4 000 chars
    const rawChunks = document.split(/\n{2,}/).map(c => c.trim()).filter(Boolean);
    const chunks = [];
    rawChunks.forEach(c => {
      if (c.length > 4000) {
        for (let i = 0; i < c.length; i += 4000) chunks.push(c.slice(i, i + 4000));
      } else {
        chunks.push(c);
      }
    });

    postMessage({ type: 'started', taskId });

    const results = [];
    for (let i = 0; i < chunks.length; i++) {
      if (_cancelRequested) {
        postMessage({ type: 'cancelled', taskId });
        return;
      }
      try {
        const r = await processChunk(chunks[i], fallbackConfig);
        results.push({ chunkIndex: i, model: r.model, result: r.result });
      } catch (err) {
        postMessage({ type: 'error', taskId, error: err.message, chunkIndex: i });
        results.push({ chunkIndex: i, model: 'error', error: err.message });
      }
      const percent = Math.round(((i + 1) / chunks.length) * 100);
      postMessage({ type: 'progress', taskId, percent, status: 'processing', lastModel: results[i]?.model });
    }

    postMessage({ type: 'result', taskId, results });

  } else if (type === 'cancel') {
    _cancelRequested = true;
  }
};
