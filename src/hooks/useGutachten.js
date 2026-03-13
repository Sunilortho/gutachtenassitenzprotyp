// src/hooks/useGutachten.js
import { useEffect, useRef, useState } from 'react';

// Lightweight hook to wire gutachten worker with a fallback config
export function useGutachtenWorker() {
  const workerRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle, running, done, cancelled, error
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [currentTaskDetails, setCurrentTaskDetails] = useState(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const ensureWorker = () => {
    if (!workerRef.current) {
      // Path may vary depending on build setup and how Vite/bundler handles workers.
      // This assumes the worker can be publicly accessed at /src/workers/gutachten-worker.js
      const w = new Worker('/src/workers/gutachten-worker.js');

      w.onmessage = (ev) => {
        const { type, taskId, percent, status: workerStatus, results: workerResults, error, lastModel } = ev.data;

        if (type === 'started') {
          setStatus('running');
          setCurrentTaskDetails({ taskId, status: 'started' });
        } else if (type === 'progress') {
          setProgress(percent);
          // Optionally update task details with last model used if needed for UI
          setCurrentTaskDetails(prev => ({ ...prev, status: 'processing', lastModel }));
        } else if (type === 'result' || type === 'error') {
          setResults(workerResults || null);
          setStatus(type === 'result' ? 'done' : 'error');
          setCurrentTaskDetails(prev => ({ ...prev, status: type }));
        } else if (type === 'cancelled') {
          setStatus('cancelled');
          setCurrentTaskDetails(prev => ({ ...prev, status: 'cancelled' }));
        }
      };
      w.onerror = () => {
        console.error("Worker error:", ev);
        setStatus('error');
        setCurrentTaskDetails(prev => ({ ...prev, status: 'error', error: ev.message || 'Unknown worker error' }))
      };
      workerRef.current = w;
    }
    return workerRef.current;
  };

  const startGutachten = (documentText, fallbackConfig = null) => {
    const w = ensureWorker();
    const taskId = 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    w.postMessage({ type: 'start', payload: { taskId, document: documentText, fallbackConfig } });
    setCurrentTaskDetails({ taskId, status: 'pending' });
    return taskId;
  };

  const cancelGutachten = (taskId) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'cancel', payload: { taskId } });
    }
  };

  return { startGutachten, cancelGutachten, status, progress, results, currentTaskDetails };
}
