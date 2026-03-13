// src/hooks/useGutachten.js
// Vite-compatible React hook for the gutachten background worker.
// The `?worker` suffix tells Vite to bundle the file as a Web Worker module.
import { useEffect, useRef, useState } from 'react';
import GutachtenWorker from '../workers/gutachten-worker.js?worker';

/**
 * useGutachtenWorker
 *
 * Exposes:
 *   startGutachten(documentText, fallbackConfig?)  → taskId
 *   cancelGutachten(taskId)
 *   status          – 'idle' | 'running' | 'done' | 'cancelled' | 'error'
 *   progress        – 0-100
 *   results         – array of chunk results, or null
 *   currentTaskDetails – { taskId, status, lastModel?, error? }
 */
export function useGutachtenWorker() {
  const workerRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [currentTaskDetails, setCurrentTaskDetails] = useState(null);

  // Terminate worker on component unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const ensureWorker = () => {
    if (!workerRef.current) {
      const w = new GutachtenWorker();

      w.onmessage = (ev) => {
        const { type, taskId, percent, results: workerResults, error, lastModel } = ev.data;

        if (type === 'started') {
          setStatus('running');
          setCurrentTaskDetails({ taskId, status: 'started' });
        } else if (type === 'progress') {
          setProgress(percent);
          setCurrentTaskDetails(prev => ({ ...prev, status: 'processing', lastModel }));
        } else if (type === 'result') {
          setResults(workerResults || null);
          setStatus('done');
          setCurrentTaskDetails(prev => ({ ...prev, status: 'done' }));
        } else if (type === 'error') {
          setResults(null);
          setStatus('error');
          setCurrentTaskDetails(prev => ({ ...prev, status: 'error', error }));
        } else if (type === 'cancelled') {
          setStatus('cancelled');
          setCurrentTaskDetails(prev => ({ ...prev, status: 'cancelled' }));
        }
      };

      w.onerror = (ev) => {
        console.error('Worker error:', ev);
        setStatus('error');
        setCurrentTaskDetails(prev => ({
          ...prev,
          status: 'error',
          error: ev.message || 'Unknown worker error',
        }));
      };

      workerRef.current = w;
    }
    return workerRef.current;
  };

  const startGutachten = (documentText, fallbackConfig = null) => {
    const w = ensureWorker();
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setStatus('running');
    setProgress(0);
    setResults(null);
    setCurrentTaskDetails({ taskId, status: 'pending' });
    w.postMessage({ type: 'start', payload: { taskId, document: documentText, fallbackConfig } });
    return taskId;
  };

  const cancelGutachten = (taskId) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'cancel', payload: { taskId } });
    }
  };

  return { startGutachten, cancelGutachten, status, progress, results, currentTaskDetails };
}
