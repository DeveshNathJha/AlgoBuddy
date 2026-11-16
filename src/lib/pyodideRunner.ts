/**
 * Pyodide In-Browser Python Runner
 * 
 * Ye module browser ke andar directly Python execute karta hai bina kisi backend server ke!
 * 1. CDN se Pyodide load karta hai (WebAssembly me Python).
 * 2. Hamare tracer harness me user ka code pass karta hai.
 * 3. Line-by-line snapshots aur stdout return karta hai.
 */

import { TraceResult } from './types';
import { PYTHON_TRACER_SCRIPT } from './pythonTracerCode';

// Global cache for Pyodide instance
let pyodideInstance: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

/**
 * Loads Pyodide script tag dynamically if not already present
 */
async function loadPyodideScript(): Promise<void> {
  if (typeof window === 'undefined') return;
  if ((window as any).loadPyodide) return;

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('pyodide-cdn-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.id = 'pyodide-cdn-script';
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error('Failed to load Pyodide from CDN'));
    document.head.appendChild(script);
  });
}

/**
 * Initializes and caches the Pyodide WebAssembly runtime
 */
export async function getPyodideInstance(onStatusUpdate?: (status: string) => void): Promise<any> {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      if (onStatusUpdate) onStatusUpdate('Loading Python WebAssembly runtime (Pyodide)...');
      await loadPyodideScript();

      if (onStatusUpdate) onStatusUpdate('Initializing Python environment...');
      const loadPyodide = (window as any).loadPyodide;
      if (!loadPyodide) {
        throw new Error('Pyodide script loaded but loadPyodide is not defined.');
      }

      pyodideInstance = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
      });

      // Load tracer harness into Python global scope
      await pyodideInstance.runPythonAsync(PYTHON_TRACER_SCRIPT);
      if (onStatusUpdate) onStatusUpdate('Python ready!');

      return pyodideInstance;
    } catch (err) {
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Executes user's Python code and returns step-by-step trace
 */
export async function runPythonWithTrace(
  userCode: string,
  onStatus?: (msg: string) => void
): Promise<TraceResult> {
  const startTime = performance.now();

  try {
    const pyodide = await getPyodideInstance(onStatus);
    if (onStatus) onStatus('Executing code trace...');

    // Escaping user code safely into python string
    // Set user code in Python global namespace
    pyodide.globals.set('__user_raw_code__', userCode);

    const jsonString = await pyodide.runPythonAsync(`
      trace_user_code(__user_raw_code__, max_steps=1000)
    `);

    const parsed: TraceResult = JSON.parse(jsonString);
    parsed.executionTimeMs = Math.round(performance.now() - startTime);

    if (onStatus) onStatus('Trace complete!');
    return parsed;
  } catch (err: any) {
    return {
      success: false,
      steps: [],
      totalSteps: 0,
      stdout: '',
      error: err.message || String(err),
      executionTimeMs: Math.round(performance.now() - startTime),
      lineHitCounts: {}
    };
  }
}

