import React, { useState } from 'react';

function PromptIdInput() {
  const [userId, setUserId] = useState('');
  const [subchapterId, setSubchapterId] = useState('');
  const [promptId, setPromptId] = useState('');
  const [finalPrompt, setFinalPrompt] = useState('');
  const [response, setResponse] = useState('');

  const handleSend = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subchapterId, promptId }),
      });
      const data = await res.json();
      setFinalPrompt(data.finalPrompt);
      setResponse(data.result);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>Send Prompt by Prompt ID</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user ID"
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={subchapterId}
          onChange={(e) => setSubchapterId(e.target.value)}
          placeholder="Enter subchapter ID"
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={promptId}
          onChange={(e) => setPromptId(e.target.value)}
          placeholder="Enter prompt ID"
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <button onClick={handleSend} style={{ padding: '8px 16px', cursor: 'pointer' }}>
        Send
      </button>
      <h2>Final Prompt Sent:</h2>
      <div style={{ whiteSpace: 'pre-wrap', border: '1px solid #ccc', padding: '8px' }}>
        {finalPrompt}
      </div>
      <h2>Response:</h2>
      <div style={{ whiteSpace: 'pre-wrap', border: '1px solid #ccc', padding: '8px' }}>
        {response}
      </div>
    </div>
  );
}

export default PromptIdInput;