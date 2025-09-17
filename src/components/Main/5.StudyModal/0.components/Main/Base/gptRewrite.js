// src/api/gptRewrite.js
export async function gptRewrite(html, styleKey) {
    const system = `You are a pedagogy assistant. Rewrite the passage below
    into the "${styleKey}" style only, keep inline math intact, return HTML.`;
  
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method : "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: system },
          { role: "user",   content: html },
        ],
        temperature: 0.4,
      }),
    });
  
    const json = await resp.json();
    return json.choices?.[0]?.message?.content ?? html;
  }