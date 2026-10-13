export const config = {
  runtime: 'edge', 
};

interface AIProviderConfig {
  id: string;
  name: string;
  defaultModel: string;
}

const PRESET_PROVIDERS: AIProviderConfig[] = [
  { id: "gemini-flash", name: "Gemini", defaultModel: "gemini-2.0-flash" },
  { id: "claude-anthropic", name: "Claude", defaultModel: "claude-3-5-sonnet-20241022" },
  { id: "nemotron-openrouter", name: "Nemotron", defaultModel: "nvidia/nemotron-3-ultra-550b-a55b:free" }
];

interface ProviderRoute {
  endpoint: (model: string) => string;
  apiKey: string | undefined;
  headers: (key: string) => Record<string, string>;
  formatBody: (model: string, prompt: any) => any;
  parseResponse: (data: any) => string;
}

const extractText = (prompt: any): string => {
  if (typeof prompt === 'string') return prompt;
  if (!prompt) return "Hello";
  if (typeof prompt === 'object') {
    if (typeof prompt.content === 'string') return prompt.content;
    if (typeof prompt.prompt === 'string') return prompt.prompt;
    if (Array.isArray(prompt)) {
      return prompt.map(m => m.content || m.text || JSON.stringify(m)).join('\n');
    }
  }
  return String(prompt);
};

const extractMessages = (prompt: any) => {
  const text = extractText(prompt);
  return [{ role: "user", content: text }];
};

const PROVIDER_ROUTES: Record<string, ProviderRoute> = {
  "nemotron-openrouter": {
    endpoint: () => "https://openrouter.ai/api/v1/chat/completions",
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://bponexus.io",
      "X-Title": "BPO Nexus Jarvis",
    }),
    formatBody: (model, prompt) => ({
      model: model || "nvidia/nemotron-3-ultra-550b-a55b:free",
      messages: extractMessages(prompt),
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || "",
  },

  "gemini-flash": {
    endpoint: (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash'}:generateContent`,
    apiKey: process.env.GEMINI_API_KEY,
    headers: () => ({
      "Content-Type": "application/json",
    }),
    formatBody: (_, prompt) => ({
      contents: [{ parts: [{ text: extractText(prompt) }] }],
    }),
    parseResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || "",
  },

  "claude-anthropic": {
    endpoint: () => "https://api.anthropic.com/v1/messages",
    apiKey: process.env.ANTHROPIC_API_KEY,
    headers: (key) => ({
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    }),
    formatBody: (_, prompt) => ({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: extractMessages(prompt),
    }),
    parseResponse: (data) => data.content?.[0]?.text || "",
  },
};

async function executeCall(provider: AIProviderConfig, prompt: any) {
  const route = PROVIDER_ROUTES[provider.id];
  if (!route) throw new Error(`Unknown provider configuration: ${provider.id}`);

  if (!route.apiKey) {
    throw new Error(`Missing API Key in Vercel Environment Variables for ${provider.name}`);
  }

  const rawEndpoint = route.endpoint(provider.defaultModel);
  const url = provider.id === "gemini-flash" 
    ? `${rawEndpoint}?key=${route.apiKey}`
    : rawEndpoint;

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

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();
    const rawPrompt = body.prompt ?? body.message ?? body;

    const primary = PRESET_PROVIDERS.find((p) => p.id === body.primaryId) ?? PRESET_PROVIDERS[0];
    const fallback = PRESET_PROVIDERS.find((p) => p.id === body.fallbackId) ?? PRESET_PROVIDERS[1];

    try {
      const responseText = await executeCall(primary, rawPrompt);
      return Response.json({ text: responseText, providerUsed: primary.name });
    } catch (primaryError: any) {
      console.warn(`[Jarvis Failover] Primary (${primary.name}) failed:`, primaryError.message);
      
      const fallbackText = await executeCall(fallback, rawPrompt);
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