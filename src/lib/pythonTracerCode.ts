/**
 * Python execution tracer, run inside Pyodide.
 *
 * Semantics (same as Python Tutor): a 'line' step is recorded just BEFORE that
 * line runs, so `variables` show the state the line is about to see, and
 * `changedVariables` lists what the previous step in the same frame changed.
 */

export const TRACE_MAX_STEPS = 2000;

export const PYTHON_TRACER_SCRIPT = `
import sys
import io
import json
import types

class TraceLimitExceeded(Exception):
    pass

_SKIP_TYPES = (types.FunctionType, types.BuiltinFunctionType, types.ModuleType, types.MethodType, type)
_MAX_REPR = 200
_MAX_STDOUT = 5000

def _short(s):
    return s if len(s) <= _MAX_REPR else s[:_MAX_REPR - 3] + "..."

def serialize_val(val):
    try:
        r = repr(val)
        # Objects with the default repr (e.g. ListNode, TreeNode) become ClassName(field=value, ...)
        if " object at 0x" in r and hasattr(val, "__dict__"):
            parts = []
            for k, v in list(vars(val).items())[:6]:
                inner = v.__class__.__name__ if hasattr(v, "__dict__") and " object at 0x" in repr(v) else repr(v)
                parts.append(f"{k}={_short(inner)}")
            r = f"{type(val).__name__}({', '.join(parts)})"
        return _short(r)
    except Exception:
        return f"<{type(val).__name__}>"

def _visible_vars(frame):
    out = {}
    for k, v in frame.f_locals.items():
        if k.startswith("__") or isinstance(v, _SKIP_TYPES):
            continue
        out[k] = serialize_val(v)
    return out

def trace_user_code(user_code_str, max_steps=${TRACE_MAX_STEPS}):
    steps = []
    line_hits = {}
    prev_by_frame = {}
    stdout_capture = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = stdout_capture
    state = {"error_line": None}

    def call_stack(frame):
        stack = []
        f = frame
        while f is not None:
            if f.f_code.co_filename == "<solution>":
                stack.append({"functionName": f.f_code.co_name, "lineNumber": f.f_lineno, "filename": "solution.py"})
            f = f.f_back
        return stack

    def record(frame, event, return_value=None):
        if len(steps) >= max_steps:
            raise TraceLimitExceeded(
                f"Stopped after {max_steps} steps (possible infinite loop, or the input is too large to visualize)."
            )
        lineno = frame.f_lineno
        if event == "line":
            line_hits[lineno] = line_hits.get(lineno, 0) + 1
        current = _visible_vars(frame)
        prev = prev_by_frame.get(id(frame), {})
        changed = [k for k, v in current.items() if prev.get(k) != v] if id(frame) in prev_by_frame else []
        prev_by_frame[id(frame)] = current
        out = stdout_capture.getvalue()
        step = {
            "stepIndex": len(steps),
            "lineNumber": lineno,
            "event": event,
            "functionName": frame.f_code.co_name,
            "variables": current,
            "changedVariables": changed,
            "callStack": call_stack(frame),
            "stdoutSoFar": out[-_MAX_STDOUT:],
            "iteration": line_hits.get(lineno, 1),
        }
        if return_value is not None:
            step["returnValue"] = return_value
        steps.append(step)

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != "<solution>":
            return tracer
        if event == "line":
            # A new line ran, so any earlier exception was caught by the user's code.
            state["error_line"] = None
            record(frame, "line")
        elif event == "return":
            record(frame, "return", serialize_val(arg))
            prev_by_frame.pop(id(frame), None)
        elif event == "exception":
            if state["error_line"] is None:
                state["error_line"] = frame.f_lineno
        return tracer

    error = None
    truncated = False
    try:
        compiled = compile(user_code_str, "<solution>", "exec")
        sys.settrace(tracer)
        exec(compiled, {"__name__": "__main__", "__builtins__": __builtins__})
    except TraceLimitExceeded as tle:
        error = str(tle)
        truncated = True
    except SyntaxError as e:
        state["error_line"] = e.lineno
        error = f"SyntaxError: {e.msg} (line {e.lineno})"
    except Exception as e:
        line = state["error_line"]
        error = f"{type(e).__name__}: {e}" + (f" (line {line})" if line else "")
    finally:
        sys.settrace(None)
        sys.stdout = old_stdout

    return json.dumps({
        "success": error is None,
        "steps": steps,
        "totalSteps": len(steps),
        "stdout": stdout_capture.getvalue()[-_MAX_STDOUT:],
        "error": error,
        "errorLine": state["error_line"],
        "truncated": truncated,
        "lineHitCounts": line_hits,
    })
`;
