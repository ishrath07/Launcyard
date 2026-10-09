"use client";

import { useState } from "react";
import { askStoreAssistant } from "@/server/chat-actions";

const PROMPTS = [
  "What are my top 5 selling products this month?",
  "Which products are low on stock?",
  "Revenue last week vs this week?",
];

type Turn = {
  question: string;
  answer: string;
  source: string;
  evidence: Record<string, string | number>[];
};

export function AssistantDesk({
  storeId,
  history,
}: {
  storeId: string;
  history: Turn[];
}) {
  const [turns, setTurns] = useState(history);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);

  async function ask(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setPending(true);
    const result = await askStoreAssistant(storeId, clean);
    setTurns((current) => [...current, { question: clean, answer: result.text, source: result.source, evidence: result.evidence }]);
    setQuestion("");
    setPending(false);
  }

  return (
    <div>
      <p className="muted">Answers come from this store only. The assistant cannot change data, and it shows the rows behind each number.</p>
      <div className="chips" style={{ marginBottom: 12 }}>
        {PROMPTS.map((prompt) => (
          <button key={prompt} className="chip" type="button" onClick={() => void ask(prompt)}>{prompt}</button>
        ))}
      </div>
      {turns.map((turn, index) => (
        <article key={index} className="panel" style={{ marginBottom: 10 }}>
          <strong>{turn.question}</strong>
          <p>{turn.answer}</p>
          <p className="muted">Source: {turn.source}</p>
          {!!turn.evidence.length && (
            <table>
              <thead>
                <tr>{Object.keys(turn.evidence[0]).map((key) => <th key={key}>{key}</th>)}</tr>
              </thead>
              <tbody>
                {turn.evidence.map((row, rowIndex) => (
                  <tr key={rowIndex}>{Object.values(row).map((value, valueIndex) => <td key={valueIndex}>{String(value)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      ))}
      <form onSubmit={(event) => { event.preventDefault(); void ask(question); }}>
        <label className="field"><span>Ask about this store</span><input value={question} onChange={(event) => setQuestion(event.target.value)} /></label>
        <button className="btn" disabled={pending} type="submit">{pending ? "Looking up…" : "Ask"}</button>
      </form>
    </div>
  );
}
