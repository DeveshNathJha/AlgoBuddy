/**
 * Plain-language explanations for the Python errors students hit most often.
 * The Debugger shows this first, with Python's own message underneath.
 */

const EXPLANATIONS: [RegExp, string][] = [
  [/^IndexError/, 'Your code tried to use a position that does not exist, for example `nums[5]` when the list only has 5 items (positions 0 to 4). Check your loop bounds.'],
  [/^KeyError/, 'Your code looked up a key that is not in the dictionary. Check it exists first with `if key in d`, or use `d.get(key)`.'],
  [/^ZeroDivisionError/, 'Your code divided by zero. Check the value of the divisor before dividing.'],
  [/^NameError/, 'Your code used a name that has not been defined yet. Check for a typo, or that the variable is set before this line.'],
  [/^UnboundLocalError/, 'A variable was used inside a function before it was given a value there.'],
  [/^TypeError/, 'An operation got the wrong kind of value, for example adding a number to a string, calling a function with the wrong number of arguments, or using `None` as if it were a list.'],
  [/^AttributeError/, 'Your code used a method or field that this value does not have, for example calling `.append` on something that is not a list (often `None`).'],
  [/^ValueError/, 'A function got a value of the right type but an invalid content, for example `int("abc")`.'],
  [/^RecursionError/, 'A function kept calling itself without stopping. Check that your recursion has a base case that is always reached.'],
  [/^(IndentationError|TabError)/, 'The indentation is off. Python uses indentation to group lines, so check the spaces at the start of this line.'],
  [/^SyntaxError/, 'Python could not read this line: something like a missing `:`, bracket, or quote.'],
  [/^(ModuleNotFoundError|ImportError)/, 'This module is not available in the in-browser Python. Use the standard library only.'],
  [/^AssertionError/, 'An `assert` in your code was false.'],
  [/^(OSError|EOFError).*(input|I\/O|stdin)|^EOFError/i, 'The Debugger cannot read keyboard input. Replace `input()` with fixed sample values in your code.'],
];

export function explainPythonError(error: string): string | null {
  const found = EXPLANATIONS.find(([re]) => re.test(error.trim()));
  return found ? found[1] : null;
}
