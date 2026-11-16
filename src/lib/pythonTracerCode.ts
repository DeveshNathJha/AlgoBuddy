/**
 * Python Execution Tracer Script
 * 
 * Runs inside Pyodide WebAssembly.
 * Records step-by-step state snapshots with hard abort protection against infinite loops.
 */

export const PYTHON_TRACER_SCRIPT = `
import sys
import io
import json

class TraceLimitExceeded(Exception):
    """Raised to immediately terminate code execution if step limit is reached"""
    pass

def serialize_val(val):
    """Safely converts Python objects to clean readable string representations for UI"""
    try:
        if isinstance(val, (int, float, bool, str, list, dict, set, tuple)):
            s = repr(val)
            if len(s) > 120:
                s = s[:117] + "..."
            return s
        return f"<{type(val).__name__}>"
    except Exception:
        return "<unprintable>"

def trace_user_code(user_code_str, max_steps=1000):
    steps = []
    line_hits = {}
    stdout_capture = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = stdout_capture
    
    prev_vars = {}
    loop_tracker = {}
    
    def tracer(frame, event, arg):
        nonlocal prev_vars
        
        # Only trace the user script
        if frame.f_code.co_filename != '<string>':
            return tracer
            
        if len(steps) >= max_steps:
            # HARD ABORT: Raising exception stops Python execution immediately,
            # preventing infinite loops (e.g. while True) from freezing the browser thread!
            raise TraceLimitExceeded(f"Execution step limit ({max_steps}) exceeded. Execution stopped to protect browser.")
            
        lineno = frame.f_lineno
        func_name = frame.f_code.co_name
        
        line_hits[lineno] = line_hits.get(lineno, 0) + 1
        
        raw_locals = frame.f_locals
        current_vars = {}
        changed_vars = []
        
        for k, v in raw_locals.items():
            if not k.startswith('__') and k not in ('_tracer_result', 'serialize_val', 'tracer', 'TraceLimitExceeded'):
                v_str = serialize_val(v)
                current_vars[k] = v_str
                if k not in prev_vars or prev_vars[k] != v_str:
                    changed_vars.append(k)
                    
        stack = []
        curr_frame = frame
        while curr_frame:
            if curr_frame.f_code.co_filename == '<string>':
                stack.append({
                    "functionName": curr_frame.f_code.co_name,
                    "lineNumber": curr_frame.f_lineno,
                    "filename": "solution.py"
                })
            curr_frame = curr_frame.f_back
            
        loop_hits = line_hits[lineno]
        
        step_data = {
            "stepIndex": len(steps),
            "lineNumber": lineno,
            "event": event,
            "functionName": func_name,
            "variables": current_vars,
            "changedVariables": changed_vars,
            "callStack": stack,
            "stdoutSoFar": stdout_capture.getvalue(),
            "loopInfo": {
                "iteration": loop_hits,
                "isLoopHeader": loop_hits > 1
            }
        }
        
        steps.append(step_data)
        prev_vars = dict(current_vars)
        return tracer

    execution_error = None
    try:
        compiled = compile(user_code_str, '<string>', 'exec')
        sys.settrace(tracer)
        exec(compiled, {})
    except TraceLimitExceeded as tle:
        execution_error = str(tle)
    except Exception as e:
        execution_error = f"{type(e).__name__}: {str(e)}"
    finally:
        sys.settrace(None)
        sys.stdout = old_stdout

    return json.dumps({
        "success": execution_error is None or isinstance(execution_error, str) and len(steps) > 0,
        "steps": steps,
        "totalSteps": len(steps),
        "stdout": stdout_capture.getvalue(),
        "error": execution_error,
        "lineHitCounts": line_hits
    })
`;
