export type AIProvider = 'gemini' | 'ollama-cloud';

export interface TranslationOptions {
  provider: AIProvider;
  model?: string;
  baseUrl?: string;
}

export async function checkProviderStatus(options: TranslationOptions): Promise<{ success: boolean; message: string }> {
  try {
    const params = new URLSearchParams({
      provider: options.provider,
    });
    if (options.baseUrl) {
      params.set('baseUrl', options.baseUrl);
    }

    const response = await fetch(`/api/openlens/health?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.detail || "Health check failed." };
    }
    return data;
  } catch {
    return { success: false, message: "Connection failed." };
  }
}

export async function translatePhilosophicalTextStream(
  text: string, 
  options: TranslationOptions,
  onChunk: (chunk: string) => void
): Promise<void> {
  if (!text || text.trim().length === 0) return;
  
  try {
    const response = await fetch('/api/openlens/translate/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: options.provider,
        text,
        model: options.model,
        baseUrl: options.baseUrl,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Translation error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  } catch (error: any) {
    onChunk(`\n\nError: ${error.message || "Could not connect to the translation service."}`);
  }
}
