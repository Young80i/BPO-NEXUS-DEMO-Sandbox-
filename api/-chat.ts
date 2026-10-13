import { PRESET_PROVIDERS, type AIProviderConfig } from "../src/routes/settings";

export const config = {
  runtime: 'edge', // This is the magic line that prevents Vercel 10-second timeouts!
};

interface ProviderRoute {
  endpoint: string;
  apiKey: string | undefined;
  headers: (key: string) => Record<string, string>;
  formatBody: (model: string, prompt: string) => any;
  parseResponse: (data: any) => string;
}

// Hardcoded provider routing configuration
const PROVIDER_ROUTES: Record<string, ProviderRoute> = {
  "nemotron-openrouter": {
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://bponexus.io",
      "X-Title": "BPO Nexus Jarvis",
    }),
    formatBody: (model, prompt) => ({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || "",
  },

  "gemini-flash": {
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    apiKey: process.env.GEMINI_API_KEY,
    headers: () => ({
      "Content-Type": "application/json",
    }),
    formatBody: (_, prompt) => ({
      contents: [{ parts: [{ text: prompt }] }],
    }),
    parseResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || "",
  },

  "claude-anthropic": {
    endpoint: "https://api.anthropic.com/v1/messages",
    apiKey: process.env.ANTHROPIC_API_KEY,
    headers: (key) => ({
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    }),
    formatBody: (model, prompt) => ({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
    parseResponse: (data) => data.content?.[0]?.text || "",
  },
};

async function executeCall(provider: AIProviderConfig, prompt: string) {
  const route = PROVIDER_ROUTES[provider.id];
  if (!route) throw new Error(`Unknown provider configuration: ${provider.id}`);

  if (!route.apiKey) {
    throw new Error(`Missing API Key in .env.local for ${provider.name}`);
  }

  const url = provider.id === "gemini-flash" 
    ? `${route.endpoint}?key=${route.apiKey}`
    : route.endpoint;

  const res = await fetch(url, {
    method: "POST",
    headers: route.headers(route.apiKey),
    body: JSON.stringify(route.formatBody(provider.defaultModel, prompt)),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Provider ${provider.name} failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return route.parseResponse(data);
}

// VERCEL DEFAULT EXPORT HANDLER
export default async function handler(req: Request) {
  // 1. Vercel requires us to manually block non-POST requests here
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  try {
    const { prompt, primaryId, fallbackId } = await req.json();

    const primary = PRESET_PROVIDERS.find((p) => p.id === primaryId) ?? PRESET_PROVIDERS[0];
    const fallback = PRESET_PROVIDERS.find((p) => p.id === fallbackId) ?? PRESET_PROVIDERS[1];

    // 2. Attempt primary provider call
    try {
      const responseText = await executeCall(primary, prompt);
      return Response.json({ text: responseText, providerUsed: primary.name });
    } catch (primaryError: any) {
      console.warn(`[Jarvis Failover] Primary (${primary.name}) failed:`, primaryError.message);
      
      // 3. Automatic fallback execution on rate limit or API failure
      const fallbackText = await executeCall(fallback, prompt);
      return Response.json({ 
        text: fallbackText, 
        providerUsed: fallback.name, 
        wasFallback: true 
      });
    }
  } catch (err: any) {
    return Response.json({ error: err.message || "All API providers failed." }, { status: 500 });
  }
}