// gutachten-worker.js
// Simple Web Worker to process gutachten in chunks with a fallback chain

// If your build system bundles workers differently, adjust import path for local-stub
importScripts('/src/models/local-stub.js'); // adjust path as needed

let _cancelRequested = false;

// Tiny digest for deterministic stub output
function digest(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

// Lightweight local-stub runner (offline)
async function runLocalStub(input) {
  const digestVal = digest(input);
  // deterministic, tiny summary
  return { summary: `stub-summary:${input.slice(0, 200)}...`, digest: digestVal };
}

// Placeholder for a real OpenRouter/Gemini call
async function callPrimaryModel(chunk) {
  // In a real implementation, replace with fetch to OpenRouter.
  // Here we simulate unavailability to exercise fallback path.
  throw new Error('OpenRouter unavailable');
}

// Fallback chain runner
async function runThroughFallback(chunk, fallbackConfig) {
  let lastError;
  for (const step of (fallbackConfig?.fallbackChain || [])) {
    try {
      if (step.model === 'gemini') {
        // Simulate a Gemini call
        const res = { summary: `gemini-simulated:${chunk.slice(0, 200)}` };
        return { model: 'gemini', result: res };
      } else if (step.model === 'local-stub') {
        const res = await runLocalStub(chunk);
        return { model: 'local-stub', result: res };
      } else if (step.model.startsWith('openrouter')) {
        // If you wire real OpenRouter calls, implement here
        throw new Error('OpenRouter not wired in worker');
      }
    } catch (err) {
      lastError = err;
      // try next in chain
    }
  }
  throw lastError || new Error('Fallback chain exhausted');
}

async function processChunk(chunk, fallbackConfig) {
  // Try primary path first
  try {
    const primary = await callPrimaryModel(chunk);
    return { model: 'primary', result: primary };
  } catch (e) {
    // Fallback path
    const { fallbackChain } = fallbackConfig;
    return await runThroughFallback(chunk, fallbackConfig);
  }
}

// Entry point: start task with document text; we chunk by paragraphs for simplicity
self.onmessage = async (e) => {
  const { type, payload } = e.data;
  if (type === 'start') {
    _cancelRequested = false;
    const { taskId, document, fallbackConfig } = payload;
    // naive chunking: split on blank lines; split long chunks further
    const rawChunks = document.split(/\n{2,}/).map(c => c.trim()).filter(Boolean);
    const chunks = [];
    rawChunks.forEach(c => {
      if (c.length > 4000) {
        for (let i = 0; i < c.length; i += 4000) {
          chunks.push(c.slice(i, i + 4000));
        }
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
      const chunk = chunks[i];
      try {
        const r = await processChunk(chunk, fallbackConfig);
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
