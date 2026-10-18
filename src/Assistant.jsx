'use client';

import { useState } from 'react';

export default function Assistant() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask(event) {
    event.preventDefault();
    setLoading(true);
    setAnswer('');
    setError('');
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The guide is unavailable.');
      setAnswer(data.answer);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="assistant">
      <div className="assistant-intro"><span className="assistant-spark">✦</span><div><strong>Not sure where to start?</strong><p>Ask Harborline for a simple next step. No personal details needed.</p></div></div>
      <form onSubmit={ask} className="assistant-form"><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="e.g. I need a safe place tonight" maxLength={500} aria-label="Ask Harborline a question" /><button type="submit" disabled={loading || question.trim().length < 2}>{loading ? 'Thinking…' : 'Ask'}</button></form>
      {answer && <p className="assistant-result">{answer}</p>}
      {error && <p className="assistant-error">{error}</p>}
    </div>
  );
}
