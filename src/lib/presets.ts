/**
 * AlgoBuddy - Problem library.
 *
 * Each problem has one signature (`fn` + `params` + `returns`). Starter code for
 * all four languages is generated from it, so Python / Java / C++ / JavaScript
 * stay in sync. Each problem also carries a Python reference solution, loaded
 * only on request (and used by the debugger demo).
 */

import { ProgrammingLanguage } from './types';

type ValueType = 'int' | 'int[]' | 'string' | 'bool';
type Value = number | number[] | string | boolean;

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface ProblemPreset {
  id: string;
  leetcode: number;
  title: string;
  difficulty: Difficulty;
  pattern: string;
  description: string;
  fn: { snake: string; camel: string };
  params: { name: string; type: ValueType; sample: Value }[];
  returns: ValueType;
  /** Python function body only (the sample call is appended automatically). */
  pythonSolution: string;
  /** Expected stdout of the sample call, in Python formatting (used by tests). */
  expectedOutput: string;
}

export const PATTERN_ORDER = [
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Binary Search',
  'Dynamic Programming',
];

export const DSA_PRESETS: ProblemPreset[] = [
  {
    id: 'two-sum',
    leetcode: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    pattern: 'Arrays & Hashing',
    description: `Two Sum

Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. Exactly one valid answer exists, and the same element cannot be used twice. Return the indices in any order.

Example 1:
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: nums[0] + nums[1] = 2 + 7 = 9

Example 2:
Input: nums = [3, 2, 4], target = 6
Output: [1, 2]

Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i], target <= 10^9`,
    fn: { snake: 'two_sum', camel: 'twoSum' },
    params: [
      { name: 'nums', type: 'int[]', sample: [2, 7, 11, 15] },
      { name: 'target', type: 'int', sample: 9 },
    ],
    returns: 'int[]',
    pythonSolution: `def two_sum(nums, target):
    seen = {}  # value -> index
    for i, num in enumerate(nums):
        need = target - num
        if need in seen:
            return [seen[need], i]
        seen[num] = i
    return []`,
    expectedOutput: '[0, 1]',
  },
  {
    id: 'contains-duplicate',
    leetcode: 217,
    title: 'Contains Duplicate',
    difficulty: 'Easy',
    pattern: 'Arrays & Hashing',
    description: `Contains Duplicate

Given an integer array nums, return true if any value appears at least twice, and false if every element is distinct.

Example 1:
Input: nums = [1, 2, 3, 1]
Output: true

Example 2:
Input: nums = [1, 2, 3, 4]
Output: false

Constraints:
- 1 <= nums.length <= 10^5
- -10^9 <= nums[i] <= 10^9`,
    fn: { snake: 'contains_duplicate', camel: 'containsDuplicate' },
    params: [{ name: 'nums', type: 'int[]', sample: [1, 2, 3, 1] }],
    returns: 'bool',
    pythonSolution: `def contains_duplicate(nums):
    seen = set()
    for num in nums:
        if num in seen:
            return True
        seen.add(num)
    return False`,
    expectedOutput: 'True',
  },
  {
    id: 'valid-anagram',
    leetcode: 242,
    title: 'Valid Anagram',
    difficulty: 'Easy',
    pattern: 'Arrays & Hashing',
    description: `Valid Anagram

Given two strings s and t, return true if t is an anagram of s (uses exactly the same letters the same number of times), otherwise return false.

Example 1:
Input: s = "anagram", t = "nagaram"
Output: true

Example 2:
Input: s = "rat", t = "car"
Output: false

Constraints:
- 1 <= s.length, t.length <= 5 * 10^4
- s and t contain only lowercase English letters`,
    fn: { snake: 'is_anagram', camel: 'isAnagram' },
    params: [
      { name: 's', type: 'string', sample: 'anagram' },
      { name: 't', type: 'string', sample: 'nagaram' },
    ],
    returns: 'bool',
    pythonSolution: `def is_anagram(s, t):
    if len(s) != len(t):
        return False
    count = {}
    for ch in s:
        count[ch] = count.get(ch, 0) + 1
    for ch in t:
        if count.get(ch, 0) == 0:
            return False
        count[ch] -= 1
    return True`,
    expectedOutput: 'True',
  },
  {
    id: 'valid-palindrome',
    leetcode: 125,
    title: 'Valid Palindrome',
    difficulty: 'Easy',
    pattern: 'Two Pointers',
    description: `Valid Palindrome

A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing every non-alphanumeric character, it reads the same forward and backward. Given a string s, return true if it is a palindrome, otherwise false.

Example 1:
Input: s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" reads the same both ways.

Example 2:
Input: s = "race a car"
Output: false

Constraints:
- 1 <= s.length <= 2 * 10^5
- s contains printable ASCII characters`,
    fn: { snake: 'is_palindrome', camel: 'isPalindrome' },
    params: [{ name: 's', type: 'string', sample: 'A man, a plan, a canal: Panama' }],
    returns: 'bool',
    pythonSolution: `def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        if not s[left].isalnum():
            left += 1
        elif not s[right].isalnum():
            right -= 1
        elif s[left].lower() != s[right].lower():
            return False
        else:
            left += 1
            right -= 1
    return True`,
    expectedOutput: 'True',
  },
  {
    id: 'container-with-most-water',
    leetcode: 11,
    title: 'Container With Most Water',
    difficulty: 'Medium',
    pattern: 'Two Pointers',
    description: `Container With Most Water

You are given an array height where height[i] is the height of a vertical line at position i. Choose two lines that, together with the x-axis, form a container. Return the maximum amount of water such a container can hold. The amount is (distance between the lines) * (height of the shorter line).

Example 1:
Input: height = [1, 8, 6, 2, 5, 4, 8, 3, 7]
Output: 49
Explanation: lines at index 1 (height 8) and index 8 (height 7): 7 * 7 = 49

Example 2:
Input: height = [1, 1]
Output: 1

Constraints:
- 2 <= height.length <= 10^5
- 0 <= height[i] <= 10^4`,
    fn: { snake: 'max_area', camel: 'maxArea' },
    params: [{ name: 'height', type: 'int[]', sample: [1, 8, 6, 2, 5, 4, 8, 3, 7] }],
    returns: 'int',
    pythonSolution: `def max_area(height):
    left, right = 0, len(height) - 1
    best = 0
    while left < right:
        width = right - left
        area = width * min(height[left], height[right])
        best = max(best, area)
        # Move the shorter line: it limits the area
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return best`,
    expectedOutput: '49',
  },
  {
    id: 'best-time-to-buy-and-sell-stock',
    leetcode: 121,
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    pattern: 'Sliding Window',
    description: `Best Time to Buy and Sell Stock

prices[i] is the price of a stock on day i. Choose one day to buy and a later day to sell. Return the maximum profit you can make, or 0 if no profit is possible.

Example 1:
Input: prices = [7, 1, 5, 3, 6, 4]
Output: 5
Explanation: buy on day 1 (price 1), sell on day 4 (price 6): 6 - 1 = 5

Example 2:
Input: prices = [7, 6, 4, 3, 1]
Output: 0

Constraints:
- 1 <= prices.length <= 10^5
- 0 <= prices[i] <= 10^4`,
    fn: { snake: 'max_profit', camel: 'maxProfit' },
    params: [{ name: 'prices', type: 'int[]', sample: [7, 1, 5, 3, 6, 4] }],
    returns: 'int',
    pythonSolution: `def max_profit(prices):
    min_price = prices[0]
    best = 0
    for price in prices[1:]:
        best = max(best, price - min_price)
        min_price = min(min_price, price)
    return best`,
    expectedOutput: '5',
  },
  {
    id: 'longest-substring-without-repeating',
    leetcode: 3,
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    pattern: 'Sliding Window',
    description: `Longest Substring Without Repeating Characters

Given a string s, return the length of the longest substring (contiguous part) that contains no repeated characters.

Example 1:
Input: s = "abcabcbb"
Output: 3
Explanation: "abc" is the longest such substring.

Example 2:
Input: s = "bbbbb"
Output: 1

Constraints:
- 0 <= s.length <= 5 * 10^4
- s contains letters, digits, symbols and spaces`,
    fn: { snake: 'length_of_longest_substring', camel: 'lengthOfLongestSubstring' },
    params: [{ name: 's', type: 'string', sample: 'abcabcbb' }],
    returns: 'int',
    pythonSolution: `def length_of_longest_substring(s):
    last_seen = {}  # char -> last index
    left = 0
    best = 0
    for right, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= left:
            left = last_seen[ch] + 1
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best`,
    expectedOutput: '3',
  },
  {
    id: 'valid-parentheses',
    leetcode: 20,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    pattern: 'Stack',
    description: `Valid Parentheses

Given a string s containing only the characters ( ) { } [ ], return true if it is valid. It is valid when every opening bracket is closed by the same type of bracket, in the correct order.

Example 1:
Input: s = "{[()]}"
Output: true

Example 2:
Input: s = "(]"
Output: false

Constraints:
- 1 <= s.length <= 10^4
- s contains only ( ) { } [ ]`,
    fn: { snake: 'is_valid', camel: 'isValid' },
    params: [{ name: 's', type: 'string', sample: '{[()]}' }],
    returns: 'bool',
    pythonSolution: `def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
        else:
            stack.append(ch)
    return len(stack) == 0`,
    expectedOutput: 'True',
  },
  {
    id: 'binary-search',
    leetcode: 704,
    title: 'Binary Search',
    difficulty: 'Easy',
    pattern: 'Binary Search',
    description: `Binary Search

Given a sorted (ascending) array of distinct integers nums and a target, return the index of target, or -1 if it is not present. The solution must run in O(log n) time.

Example 1:
Input: nums = [-1, 0, 3, 5, 9, 12], target = 9
Output: 4

Example 2:
Input: nums = [-1, 0, 3, 5, 9, 12], target = 2
Output: -1

Constraints:
- 1 <= nums.length <= 10^4
- All values are distinct and sorted ascending`,
    fn: { snake: 'search', camel: 'search' },
    params: [
      { name: 'nums', type: 'int[]', sample: [-1, 0, 3, 5, 9, 12] },
      { name: 'target', type: 'int', sample: 9 },
    ],
    returns: 'int',
    pythonSolution: `def search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    expectedOutput: '4',
  },
  {
    id: 'search-rotated-sorted-array',
    leetcode: 33,
    title: 'Search in Rotated Sorted Array',
    difficulty: 'Medium',
    pattern: 'Binary Search',
    description: `Search in Rotated Sorted Array

A sorted array of distinct integers was rotated at an unknown pivot, e.g. [0, 1, 2, 4, 5, 6, 7] became [4, 5, 6, 7, 0, 1, 2]. Given the rotated array nums and a target, return the index of target, or -1 if it is not present. The solution must run in O(log n) time.

Example 1:
Input: nums = [4, 5, 6, 7, 0, 1, 2], target = 0
Output: 4

Example 2:
Input: nums = [4, 5, 6, 7, 0, 1, 2], target = 3
Output: -1

Constraints:
- 1 <= nums.length <= 5000
- All values are distinct`,
    fn: { snake: 'search', camel: 'search' },
    params: [
      { name: 'nums', type: 'int[]', sample: [4, 5, 6, 7, 0, 1, 2] },
      { name: 'target', type: 'int', sample: 0 },
    ],
    returns: 'int',
    pythonSolution: `def search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[left] <= nums[mid]:  # left half is sorted
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:  # right half is sorted
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1
    return -1`,
    expectedOutput: '4',
  },
  {
    id: 'climbing-stairs',
    leetcode: 70,
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    pattern: 'Dynamic Programming',
    description: `Climbing Stairs

You are climbing a staircase with n steps. Each move you can climb 1 or 2 steps. Return the number of distinct ways to reach the top.

Example 1:
Input: n = 3
Output: 3
Explanation: 1+1+1, 1+2, 2+1

Example 2:
Input: n = 5
Output: 8

Constraints:
- 1 <= n <= 45`,
    fn: { snake: 'climb_stairs', camel: 'climbStairs' },
    params: [{ name: 'n', type: 'int', sample: 5 }],
    returns: 'int',
    pythonSolution: `def climb_stairs(n):
    if n <= 2:
        return n
    prev, curr = 1, 2  # ways to reach step 1 and step 2
    for _ in range(3, n + 1):
        prev, curr = curr, prev + curr
    return curr`,
    expectedOutput: '8',
  },
  {
    id: 'maximum-subarray',
    leetcode: 53,
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    pattern: 'Dynamic Programming',
    description: `Maximum Subarray

Given an integer array nums, find the contiguous subarray (at least one element) with the largest sum, and return that sum.

Example 1:
Input: nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
Output: 6
Explanation: the subarray [4, -1, 2, 1] has sum 6.

Example 2:
Input: nums = [-1]
Output: -1

Constraints:
- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4`,
    fn: { snake: 'max_sub_array', camel: 'maxSubArray' },
    params: [{ name: 'nums', type: 'int[]', sample: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }],
    returns: 'int',
    pythonSolution: `def max_sub_array(nums):
    best = current = nums[0]
    for num in nums[1:]:
        # Either extend the current subarray or start fresh at num
        current = max(num, current + num)
        best = max(best, current)
    return best`,
    expectedOutput: '6',
  },
];

// ─────────────────────────────────────────────
// Code generation
// ─────────────────────────────────────────────

const TYPE_NAMES: Record<Exclude<ProgrammingLanguage, 'python' | 'javascript'>, Record<ValueType, string>> = {
  java: { int: 'int', 'int[]': 'int[]', string: 'String', bool: 'boolean' },
  cpp: { int: 'int', 'int[]': 'vector<int>', string: 'string', bool: 'bool' },
};

function literal(value: Value, type: ValueType, lang: ProgrammingLanguage): string {
  if (type === 'string') return JSON.stringify(value);
  if (type === 'bool') return lang === 'python' ? (value ? 'True' : 'False') : String(value);
  if (type === 'int[]') {
    const items = (value as number[]).join(', ');
    return lang === 'python' || lang === 'javascript' ? `[${items}]` : `{${items}}`;
  }
  return String(value);
}

function defaultReturn(type: ValueType, lang: ProgrammingLanguage): string {
  if (type === 'int') return '0';
  if (type === 'bool') return 'false';
  if (type === 'string') return '""';
  return lang === 'java' ? 'new int[0]' : lang === 'cpp' ? '{}' : '[]';
}

function pythonHarness(p: ProblemPreset): string {
  const assigns = p.params.map((x) => `${x.name} = ${literal(x.sample, x.type, 'python')}`).join('\n');
  return `\n\n# Sample input (Example 1)\n${assigns}\nprint(${p.fn.snake}(${p.params.map((x) => x.name).join(', ')}))\n`;
}

export function buildStarterCode(p: ProblemPreset, lang: ProgrammingLanguage): string {
  const args = p.params.map((x) => x.name).join(', ');

  if (lang === 'python') {
    return `def ${p.fn.snake}(${args}):\n    # Write your solution here\n    pass${pythonHarness(p)}`;
  }

  if (lang === 'javascript') {
    const assigns = p.params.map((x) => `const ${x.name} = ${literal(x.sample, x.type, lang)};`).join('\n');
    return `function ${p.fn.camel}(${args}) {\n    // Write your solution here\n    return ${defaultReturn(p.returns, lang)};\n}\n\n// Sample input (Example 1)\n${assigns}\nconsole.log(${p.fn.camel}(${args}));\n`;
  }

  if (lang === 'java') {
    const t = TYPE_NAMES.java;
    const sig = p.params.map((x) => `${t[x.type]} ${x.name}`).join(', ');
    const assigns = p.params.map((x) => `        ${t[x.type]} ${x.name} = ${literal(x.sample, x.type, lang)};`).join('\n');
    const call = `new Solution().${p.fn.camel}(${args})`;
    const print = p.returns === 'int[]' ? `Arrays.toString(${call})` : call;
    return `import java.util.*;

class Solution {
    public ${t[p.returns]} ${p.fn.camel}(${sig}) {
        // Write your solution here
        return ${defaultReturn(p.returns, lang)};
    }

    public static void main(String[] args) {
        // Sample input (Example 1)
${assigns}
        System.out.println(${print});
    }
}
`;
  }

  // C++
  const t = TYPE_NAMES.cpp;
  const sig = p.params.map((x) => (x.type === 'int[]' ? `vector<int>& ${x.name}` : `${t[x.type]} ${x.name}`)).join(', ');
  const assigns = p.params.map((x) => `    ${t[x.type]} ${x.name} = ${literal(x.sample, x.type, lang)};`).join('\n');
  const call = `Solution().${p.fn.camel}(${args})`;
  const print =
    p.returns === 'int[]'
      ? `    vector<int> result = ${call};\n    cout << "[";\n    for (size_t i = 0; i < result.size(); i++) cout << (i ? ", " : "") << result[i];\n    cout << "]" << endl;`
      : p.returns === 'bool'
      ? `    cout << boolalpha << ${call} << endl;`
      : `    cout << ${call} << endl;`;
  return `#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <algorithm>
using namespace std;

class Solution {
public:
    ${t[p.returns]} ${p.fn.camel}(${sig}) {
        // Write your solution here
        return ${defaultReturn(p.returns, lang)};
    }
};

int main() {
    // Sample input (Example 1)
${assigns}
${print}
    return 0;
}
`;
}

export function buildPythonSolution(p: ProblemPreset): string {
  return `${p.pythonSolution}${pythonHarness(p)}`;
}

/** Blank template for the student's own problem. */
export function getStarterTemplate(lang: ProgrammingLanguage): string {
  switch (lang) {
    case 'python':
      return `def solution(nums):
    # Write your solution here
    pass


# Sample input: change it to match your problem
nums = [1, 2, 3]
print(solution(nums))
`;
    case 'java':
      return `import java.util.*;

class Solution {
    public int solve(int[] nums) {
        // Write your solution here
        return 0;
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3};
        System.out.println(new Solution().solve(nums));
    }
}
`;
    case 'cpp':
      return `#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    int solve(vector<int>& nums) {
        // Write your solution here
        return 0;
    }
};

int main() {
    vector<int> nums = {1, 2, 3};
    cout << Solution().solve(nums) << endl;
    return 0;
}
`;
    case 'javascript':
      return `function solution(nums) {
    // Write your solution here
    return null;
}

console.log(solution([1, 2, 3]));
`;
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const LANGS: ProgrammingLanguage[] = ['python', 'java', 'cpp', 'javascript'];

let boilerplate: Set<string> | null = null;
let templates: Set<string> | null = null;

function boilerplateSets() {
  if (!boilerplate || !templates) {
    templates = new Set(LANGS.map((l) => getStarterTemplate(l).trim()));
    boilerplate = new Set(templates);
    for (const p of DSA_PRESETS) {
      for (const l of LANGS) boilerplate.add(buildStarterCode(p, l).trim());
      boilerplate.add(buildPythonSolution(p).trim());
    }
  }
  return { boilerplate, templates };
}

/**
 * True when `code` is untouched boilerplate (a starter or reference solution).
 * Such code is safe to replace on a language/problem switch, and is not
 * "the student's code", so it should not be sent to the AI as if it were.
 */
export function isBoilerplateCode(code: string): boolean {
  const c = code.trim();
  return !c || boilerplateSets().boilerplate.has(c);
}

/** True for starter code with an empty body (any problem, any language). */
export function isStarterTemplate(code: string): boolean {
  const c = code.trim();
  if (!c || boilerplateSets().templates.has(c)) return true;
  return DSA_PRESETS.some((p) => LANGS.some((l) => buildStarterCode(p, l).trim() === c));
}

export function findPreset(id: string): ProblemPreset | undefined {
  return DSA_PRESETS.find((p) => p.id === id);
}

/**
 * Matches short inputs like "leetcode 1", "LC #121", "121", "two sum" against the
 * built-in library so the full statement can be loaded without any AI call.
 */
export function matchPresetReference(input: string): ProblemPreset | undefined {
  const text = input.trim().toLowerCase();
  if (!text || text.length > 80 || text.includes('\n')) return undefined;
  const num = text.match(/^(?:leetcode|lc)?\s*(?:problem|question|q)?\s*#?\s*(\d{1,4})\b/);
  if (num) return DSA_PRESETS.find((p) => p.leetcode === Number(num[1]));
  const normalized = text.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  return DSA_PRESETS.find((p) => p.title.toLowerCase() === normalized || normalized.endsWith(p.title.toLowerCase()));
}

/**
 * Heuristic: the box holds a reference ("Leetcode 42", "trapping rain water"),
 * not a full statement. Then the AI is asked to identify the problem first.
 */
export function looksLikeProblemReference(input: string): boolean {
  const text = input.trim();
  if (!text) return false;
  if (/^(?:leetcode|lc)?\s*(?:problem|question|q)?\s*#?\s*\d{1,4}\b/i.test(text) && text.length < 120) return true;
  return text.length < 70 && !text.includes('\n') && !/[.?:=]/.test(text);
}
