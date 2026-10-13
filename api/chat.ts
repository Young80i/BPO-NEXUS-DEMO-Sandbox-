export const config = {
  runtime: 'edge', 
};

interface AIProviderConfig {
  id: string;
  name: string;
  defaultModel: string;
}

const PRESET_PROVIDERS: AIProviderConfig[] = [
  { id: "gemini", name: "Gemini Flash", defaultModel: "gemini-2.0-flash" },
  { id: "openrouter", name: "NVIDIA Nemotron", defaultModel: "nvidia/nemotron-3-super-120b-a12b:free" },
  { id: "cohere", name: "Command R+", defaultModel: "command-r-plus" }
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
    if (typeof prompt.message === 'string') return prompt.message;
    if (typeof prompt.text === 'string') return prompt.text;
    if (typeof prompt.content === 'string') return prompt.content;
    if (typeof prompt.prompt === 'string') return prompt.prompt;
    
    if (Array.isArray(prompt)) {
      return prompt.map(m => m.content || m.text || m.message || JSON.stringify(m)).join('\n');
    }
    
    try {
      const stringified = JSON.stringify(prompt);
      if (stringified !== '{}' && stringified !== '[object Object]') {
        return stringified;
      }
    } catch (e) {}
  }
  
  return String(prompt);
};

const extractMessages = (prompt: any) => {
  const text = extractText(prompt);
  // Keep system overhead low to prevent timeouts
  return [{ role: "user", content: text }];
};

const PROVIDER_ROUTES: Record<string, ProviderRoute> = {
  "openrouter": {
    endpoint: () => "https://openrouter.ai/api/v1/chat/completions",
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://bponexus.io",
      "X-Title": "BPO Nexus Jarvis",
    }),
    formatBody: (model, prompt) => ({
      model: model || "nvidia/nemotron-3-super-120b-a12b:free",
      messages: extractMessages(prompt),
      max_tokens: 800, // Hard limit to ensure fast response times
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || "",
  },

  "gemini": {
    endpoint: (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash'}:generateContent`,
    apiKey: process.env.GEMINI_API_KEY,
    headers: () => ({
      "Content-Type": "application/json",
    }),
    formatBody: (_, prompt) => ({
      contents: [{ parts: [{ text: extractText(prompt) }] }],
      generationConfig: { maxOutputTokens: 800 },
    }),
    parseResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || "",
  },

  "cohere": {
    endpoint: () => "https://api.cohere.ai/v1/chat",
    apiKey: process.env.COHERE_API_KEY,
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    }),
    formatBody: (_, prompt) => ({
      model: "command-r-plus",
      message: extractText(prompt),
      max_tokens: 800,
    }),
    parseResponse: (data) => data.text || "",
  },
};

async function executeCall(provider: AIProviderConfig, prompt: any) {
  const route = PROVIDER_ROUTES[provider.id];
  if (!route) throw new Error(`Unknown provider configuration: ${provider.id}`);

  if (!route.apiKey) {
    throw new Error(`Missing API Key in Vercel Environment Variables for ${provider.name}`);
  }

  const rawEndpoint = route.endpoint(provider.defaultModel);
  const url = provider.id === "gemini" 
    ? `${rawEndpoint}?key=${route.apiKey}`
    : rawEndpoint;

  // Implement a strict 8-second controller timeout to force failover before Vercel crashes
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: route.headers(route.apiKey),
      body: JSON.stringify(route.formatBody(provider.defaultModel, prompt)),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Provider ${provider.name} failed (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    return route.parseResponse(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Provider ${provider.name} timed out after 8 seconds.`);
    }
    throw err;
  }
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
      console.warn(`[Jarvis Failover Triggered] Primary (${primary.name}) failed:`, primaryError.message);
      
      try {
        const fallbackText = await executeCall(fallback, rawPrompt);
        return Response.json({ 
          text: fallbackText, 
          providerUsed: fallback.name, 
          wasFallback: true 
        });
      } catch (fallbackError: any) {
        throw new Error(`All providers failed. Primary: ${primaryError.message} | Fallback: ${fallbackError.message}`);
      }
    }
  } catch (err: any) {
    return Response.json({ error: err.message || "All API providers failed." }, { status: 500 });
  }
}