/**
 * Pyodide in-browser Python runner.
 * Loads Python (WebAssembly) from the CDN once, then runs user code through the tracer.
 */

import { TraceResult } from './types';
import { PYTHON_TRACER_SCRIPT } from './pythonTracerCode';
import { UserError } from './errors';

const PYODIDE_VERSION = '0.26.4';
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodideInstance: any = null;
let initPromise: Promise<any> | null = null;

function loadPyodideScript(): Promise<void> {
  if (typeof window === 'undefined' || (window as any).loadPyodide) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('pyodide-cdn-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new UserError('Could not load Python. Check your internet connection and try again.')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'pyodide-cdn-script';
    script.src = `${PYODIDE_BASE}pyodide.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove(); // allow a retry on the next run
      reject(new UserError('Could not load Python. Check your internet connection and try again.'));
    };
    document.head.appendChild(script);
  });
}

export async function getPyodideInstance(onStatusUpdate?: (status: string) => void): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      onStatusUpdate?.('Loading Python runtime (first run takes a few seconds)...');
      await loadPyodideScript();

      const loadPyodide = (window as any).loadPyodide;
      if (!loadPyodide) throw new UserError('Python could not start. Please reload the page and try again.');

      onStatusUpdate?.('Starting Python...');
      const instance = await loadPyodide({ indexURL: PYODIDE_BASE });
      await instance.runPythonAsync(PYTHON_TRACER_SCRIPT);
      pyodideInstance = instance;
      return instance;
    } catch (err) {
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

export async function runPythonWithTrace(userCode: string, onStatus?: (msg: string) => void): Promise<TraceResult> {
  const startTime = performance.now();

  try {
    const pyodide = await getPyodideInstance(onStatus);
    onStatus?.('Running and recording each step...');

    pyodide.globals.set('__user_raw_code__', userCode);
    const jsonString = await pyodide.runPythonAsync('trace_user_code(__user_raw_code__)');
    const parsed = JSON.parse(jsonString) as Omit<TraceResult, 'executionTimeMs' | 'sourceCode'>;

    return { ...parsed, sourceCode: userCode, executionTimeMs: Math.round(performance.now() - startTime) };
  } catch (err) {
    console.error('[AlgoBuddy] Python runner failed:', err);
    return {
      success: false,
      steps: [],
      totalSteps: 0,
      stdout: '',
      error: err instanceof UserError ? err.message : 'Something went wrong while running your code. Please try again.',
      runnerError: true,
      executionTimeMs: Math.round(performance.now() - startTime),
      lineHitCounts: {},
      sourceCode: userCode,
    };
  }
}
