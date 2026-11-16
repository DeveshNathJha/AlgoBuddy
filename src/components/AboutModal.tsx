'use client';

import Modal from './Modal';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  freeLimit: number;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-semibold text-fg mb-1">{title}</h3>
      <div className="text-fg-muted space-y-1.5">{children}</div>
    </section>
  );
}

/** Plain-language explanation of how AI requests, keys and data are handled. Keep in sync with notes/api-and-auth.md. */
export default function AboutModal({ isOpen, onClose, freeLimit }: AboutModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How AlgoBuddy uses AI and your data"
      size="lg"
      footer={
        <>
          <span />
          <button onClick={onClose} className="btn-primary">
            Got it
          </button>
        </>
      }
    >
      <div className="space-y-5 text-sm leading-6">
        <Section title="Two ways to use the AI features">
          <p>
            <span className="font-medium text-fg">Free requests:</span> sign in and you get {freeLimit} AI requests on AlgoBuddy's own key. How to Think,
            Interview Prep, Check &amp; Fix and Explain step each use one request. Looking up a problem by its name or number is free, and failed requests
            are not counted.
          </p>
          <p>
            <span className="font-medium text-fg">Your own key:</span> add a free Google Gemini or Groq key (or an OpenAI key) in the key settings for
            unlimited use. Only the provider's own limits apply.
          </p>
        </Section>

        <Section title="What is sent to the AI">
          <p>
            To answer, AlgoBuddy sends the problem statement, the code in your editor, and (for Explain step) the variable values at that step to the AI
            provider: Groq, Google Gemini or OpenAI. Don't put passwords or personal information in your code or problem text.
          </p>
          <p>The Debugger is different: Run &amp; Trace runs your Python code entirely in your browser. That code is never sent anywhere.</p>
        </Section>

        <Section title="What is stored, and where">
          <p>
            <span className="font-medium text-fg">In your browser only:</span> your problem, code, notes, theme, and your API key if you added one.
          </p>
          <p>
            <span className="font-medium text-fg">On AlgoBuddy's server:</span> your email address and how many free requests you have used. Your code,
            notes and problems are not stored on the server.
          </p>
        </Section>

        <Section title="Your own API key">
          <p>
            It is saved in this browser. With each AI request it travels over HTTPS to AlgoBuddy's server, which passes it to the provider and does not
            store or log it. Tip: create a separate key just for AlgoBuddy, so you can revoke it at any time from the provider's website.
          </p>
        </Section>

        <Section title="Removing your data">
          <p>
            Sign out from the account menu. To remove everything from this browser, use Remove key in the key settings and clear this site's data in your
            browser settings.
          </p>
        </Section>
      </div>
    </Modal>
  );
}
