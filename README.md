# ⚡ AlgoBuddy

> **Your AI-Powered DSA & Technical Interview Companion**  
> Master *how to think through complex algorithms*, trace execution line-by-line in WebAssembly, and speak like a senior engineer in technical interviews.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-VS_Dark-blue?style=flat-square)](https://microsoft.github.io/monaco-editor/)
[![Pyodide](https://img.shields.io/badge/Pyodide-WebAssembly-orange?style=flat-square)](https://pyodide.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](LICENSE)

---

## 🌟 Why AlgoBuddy?

Most coding platforms give you problem statements and test cases, but leave you stranded when it comes to the two hardest parts of software engineering interviews:
1. **How to develop the algorithmic intuition:** Recognizing patterns, comparing tradeoffs, and asking clarifying questions.
2. **How to verbally communicate in an interview:** Articulating your thoughts clearly out loud, transitioning from brute-force to optimal solutions, and walking through code without freezing.

AlgoBuddy bridges this gap with an all-in-one developer workspace.

---

## ✨ Key Features

### 1. 💡 Structured Thinking Guide ("Kaise Sochna Hai")
- **Pattern Recognition:** Instant identification of the core pattern (*Two Pointers, Sliding Window, Monotonic Stack, etc.*) and explicit reasoning for *why* it fits.
- **Tradeoff Analysis:** Side-by-side comparison between brute-force and optimal approaches (time/space complexity, bottlenecks, and the key "Aha!" realization).
- **Progressive Hint Ladder:** 4 levels of guided hints (Nudge $\rightarrow$ Direction $\rightarrow$ Blueprint $\rightarrow$ Complete Strategy) so you practice thinking independently without getting spoiled.
- **Interview Edge Cases Checklist:** Essential boundary checks before you write code.

### 2. 🎬 In-Browser Line-by-Line Python Visualizer
- **Native WebAssembly Execution:** Powered by **Pyodide** running completely client-side in your browser. Real code execution—never hallucinated by an LLM.
- **Variable Inspector & Diffs:** Real-time variable state changes highlighted on every step.
- **Call Stack Navigation:** Full visual call frame inspector for recursion, helper functions, and nested calls.
- **Interactive Controls:** Play, pause, step forward/backward, playback speed control (0.5x, 1x, 2x), and loop iteration jump.

### 3. 🎙️ Verbal Interview Script & Speech Simulator
- **Word-for-Word Spoken Script:** Covers the entire interview dialog:
  1. Clarifying questions & constraint checks
  2. Concrete whiteboard example walkthrough
  3. Professional verbal transition from brute-force to optimal
  4. Line-by-line explanation of your written code
  5. Complexity summary and closing remarks
- **Real-Time Audio Narration:** Practice listening and speaking using the browser's built-in **Web Speech API** synthesizer.

### 4. 💻 Multi-Language Monaco Code Editor
- **Full Monaco VS Code Experience:** Integrated Microsoft Monaco Editor with syntax highlighting, auto-indentation, and dark theme.
- **Languages Supported:** Python, Java, C++, and JavaScript.
- **Built-in Presets:** Ready-to-run templates for classic interview questions (Two Sum, Binary Search, Valid Parentheses) across all supported languages.

### 5. 📝 Problem-Linked Interview Revision Notes
- Save personal interview takeaways, tricky edge cases, and interviewer traps.
- Notes are automatically tagged with the active problem title, programming language, and timestamp.
- **Global Searchable Notebook:** Review all saved problem notes in one place before your interview, with a 1-click **"Open Problem"** shortcut.

### 6. 🔒 Student-Friendly Freemium & Safe BYOK
- **2 Free Complimentary Questions:** Start practicing instantly without upfront credentials.
- **Bring Your Own Key (BYOK):** Connect your free Google Gemini or Groq Cloud key for unlimited practice.
- **100% Private & Client-Side:** API keys are stored strictly in your browser's `localStorage` and never logged or stored on any server.
- **1-Minute Step-by-Step Guide:** Built-in modal instructions to get a 100% free Google Gemini key via Google AI Studio without a credit card.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.17 or later)
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

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, React Server Components)
- **Editor:** [@monaco-editor/react](https://github.com/suren-at/monaco-react)
- **Execution Sandbox:** [Pyodide](https://pyodide.org/) (Python 3 in WebAssembly)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/)
- **AI Integrations:** Google Generative AI (Gemini 1.5/2.0 Flash), Groq Cloud LPU, OpenAI
- **Notifications:** [Sonner](https://sonner.emilkowal.ski/)
- **TTS Engine:** Browser Web Speech Synthesis API

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
