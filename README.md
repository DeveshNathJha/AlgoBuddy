# AlgoBuddy

> **Your AI-Powered DSA & Technical Interview Companion**  
> Master *how to think through complex algorithms*, trace execution line-by-line in WebAssembly, and speak like a senior engineer in technical interviews.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-VS_Dark-blue?style=flat-square)](https://microsoft.github.io/monaco-editor/)
[![Pyodide](https://img.shields.io/badge/Pyodide-WebAssembly-orange?style=flat-square)](https://pyodide.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](LICENSE)

---

## Why AlgoBuddy?

Most coding platforms give you problem statements and test cases, but leave you stranded when it comes to the two hardest parts of software engineering interviews:
1. **How to develop the algorithmic intuition:** Recognizing patterns, comparing tradeoffs, and asking clarifying questions.
2. **How to verbally communicate in an interview:** Articulating your thoughts clearly out loud, transitioning from brute-force to optimal solutions, and walking through code without freezing.

AlgoBuddy bridges this gap with an all-in-one developer workspace.

---

## Key Features

### 1. Structured Thinking Guide ("Kaise Sochna Hai")
- **Pattern Recognition:** Instant identification of the core pattern (*Two Pointers, Sliding Window, Monotonic Stack, etc.*) and explicit reasoning for *why* it fits.
- **Tradeoff Analysis:** Side-by-side comparison between brute-force and optimal approaches (time/space complexity, bottlenecks, and the key "Aha!" realization).
- **Progressive Hint Ladder:** 4 levels of guided hints (Nudge → Direction → Blueprint → Full strategy), shown *before* the solutions so you practice thinking without getting spoiled.
- **Interview Edge Cases Checklist:** Essential boundary checks before you write code.

### 2. Step-by-Step Python Debugger
- **Native WebAssembly Execution:** Powered by **Pyodide** running completely client-side in your browser. Real code execution, never hallucinated by an LLM. (Python only.)
- **Variable Inspector & Diffs:** Real-time variable state changes highlighted on every step.
- **Call Stack Navigation:** Full visual call frame inspector for recursion, helper functions, and nested calls.
- **Interactive Controls:** Play, pause, step forward/backward (or ← / → keys), playback speed (0.5x–5x), jump to next loop iteration, and clear error highlighting when your code crashes.

### 3. Interview Prep: Spoken Script & Listen Mode
- **Word-for-Word Spoken Script:** Covers the entire interview dialog:
  1. Clarifying questions & constraint checks
  2. Concrete whiteboard example walkthrough
  3. Professional verbal transition from brute-force to optimal
  4. Line-by-line explanation of your written code
  5. Complexity summary and closing remarks
- **Real-Time Audio Narration:** Practice listening and speaking using the browser's built-in **Web Speech API** synthesizer.

### 4. Multi-Language Monaco Code Editor
- **Monaco (VS Code) Editor:** Syntax highlighting and auto-indentation, with light and dark themes.
- **Languages Supported:** Python, Java, C++, and JavaScript.
- **Problem Library:** 12 classic problems grouped by pattern (Arrays & Hashing, Two Pointers, Sliding Window, Stack, Binary Search, Dynamic Programming), with starter code in all 4 languages and a Python reference solution.
- **Type just a name or number:** Enter "LeetCode 42" or "Trapping Rain Water" and AlgoBuddy loads the full statement first (from the library, or via AI) so every feature works on the right problem.

### 5. Problem-Linked Interview Revision Notes
- Save personal interview takeaways, tricky edge cases, and interviewer traps.
- Notes are automatically tagged with the active problem title, programming language, and date, and saved in your browser.
- **Searchable Notebook:** Review all saved notes in one place before your interview, with a 1-click **Open problem** shortcut.

### 6. Student-Friendly Freemium & Bring Your Own Key
- **15 Free AI Requests:** Sign in (Google or email code) and start practicing with no API key. The limit is enforced on the server and configurable via `NEXT_PUBLIC_FREE_AI_REQUESTS`.
- **Bring Your Own Key (BYOK):** Connect your free Google Gemini or Groq key for unlimited practice.
- **How keys are handled:** Your key is saved only in your browser's `localStorage`. With each request it is sent over HTTPS to the AlgoBuddy server, which forwards it to the provider and never stores or logs it.
- **1-Minute Guide:** Built-in instructions to get a free Gemini key from Google AI Studio without a credit card.

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.9 or later)
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/DeveshNathJha/AlgoBuddy.git

# Navigate to the project directory
cd AlgoBuddy

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start practicing.

Locally, no configuration is needed: sign-in codes are shown on screen, and storage falls back to memory. Copy `.env.example` to `.env.local` to add a server AI key.

### Deploying to production (Vercel)

Set these environment variables (see `.env.example` for details):

| Variable | Why |
|---|---|
| `SESSION_SECRET` | Signs the login cookie. **Required.** |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash Redis (Vercel → Storage, free tier) for sign-in codes, free-request quota and rate limits. **Required**: serverless memory is not shared between requests. |
| `GEMINI_API_KEY` (and/or `GROQ_API_KEY`) | Powers the free requests. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Sign-In (recommended). |
| `RESEND_API_KEY`, `RESEND_FROM` | Email-code sign-in. Needs a domain verified in Resend. |

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router) + React 19
- **Editor:** [@monaco-editor/react](https://github.com/suren-at/monaco-react)
- **Execution Sandbox:** [Pyodide](https://pyodide.org/) (Python 3 in WebAssembly)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/)
- **AI Integrations:** Google Gemini (3.x Flash), Groq (GPT-OSS), OpenAI. Live model lists are fetched per key.
- **Notifications:** [Sonner](https://sonner.emilkowal.ski/)
- **TTS Engine:** Browser Web Speech Synthesis API

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
