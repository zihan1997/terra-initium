const express = require('express');
const fs = require('fs');
const net = require('net');
const { GoogleGenAI } = require('@google/genai');

function getOpenLensConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    return {
      defaultGeminiModel: 'gemini-2.5-flash',
      defaultOllamaModel: 'minimax-m2.5',
      defaultOllamaHost: 'https://ollama.com',
    };
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function geminiApiKey() {
  return process.env.OPENLENS_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
}

function ollamaApiKey() {
  return process.env.OPENLENS_OLLAMA_API_KEY || process.env.OLLAMA_API_KEY || '';
}

function geminiIsConfigured() {
  return Boolean(geminiApiKey());
}

function ollamaIsConfigured() {
  return Boolean(ollamaApiKey());
}

function getGeminiClient() {
  const apiKey = geminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured on the desktop app.');
  }

  return new GoogleGenAI({ apiKey });
}

function normalizeHost(rawHost, defaultOllamaHost) {
  const host = (rawHost || process.env.OPENLENS_DEFAULT_OLLAMA_HOST || defaultOllamaHost || '').trim();
  if (!host) {
    throw new Error('Ollama host is required.');
  }

  let parsed;
  try {
    parsed = new URL(host);
  } catch {
    throw new Error('Ollama host must be a valid https URL.');
  }

  if (parsed.protocol !== 'https:' || !parsed.hostname) {
    throw new Error('Ollama host must be a valid https URL.');
  }

  const hostname = parsed.hostname.toLowerCase();
  const ipVersion = net.isIP(hostname);
  if (ipVersion !== 0) {
    if (
      hostname === '127.0.0.1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      hostname === '::1' ||
      hostname.startsWith('fc') ||
      hostname.startsWith('fd') ||
      hostname.startsWith('fe80:')
    ) {
      throw new Error('Private Ollama hosts are not allowed.');
    }
  } else if (hostname === 'localhost' || hostname === 'localhost.localdomain' || hostname.endsWith('.local')) {
    throw new Error('Local Ollama hosts are not allowed.');
  }

  parsed.pathname = '';
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString().replace(/\/$/, '');
}

function allowedOllamaHosts(defaultOllamaHost) {
  const hosts = new Set([normalizeHost(process.env.OPENLENS_DEFAULT_OLLAMA_HOST || defaultOllamaHost, defaultOllamaHost)]);
  const extras = (process.env.OPENLENS_ALLOWED_OLLAMA_HOSTS || '').split(',');
  for (const host of extras) {
    const value = host.trim();
    if (value) {
      hosts.add(normalizeHost(value, defaultOllamaHost));
    }
  }
  return hosts;
}

function validateOllamaHost(rawHost, defaultOllamaHost) {
  const host = normalizeHost(rawHost, defaultOllamaHost);
  if (!allowedOllamaHosts(defaultOllamaHost).has(host)) {
    throw new Error('Ollama host is not in the server allowlist.');
  }
  return host;
}

function ollamaHeaders() {
  const apiKey = ollamaApiKey();
  if (!apiKey) {
    throw new Error('Ollama API key is not configured on the desktop app.');
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

function buildSystemPrompt({
  sourceLanguage,
  targetLanguage,
  backgroundContext,
  previousContext,
}) {
  const source = sourceLanguage || 'the original language';
  const target = targetLanguage || 'Chinese';
  const background = backgroundContext ? `\nBackground/Context: ${backgroundContext}` : '';

  let context = '';
  if (previousContext?.original && previousContext?.translation) {
    context =
      '\n\nFor continuity, here is the previous segment translated:' +
      `\nOriginal: "${previousContext.original}"` +
      `\nTranslation: "${previousContext.translation}"` +
      '\nPlease ensure terminology and style consistency with this previous segment.';
  }

  return (
    `Translate the following scholarly or philosophical text from ${source} into ${target}.` +
    `${background}${context}\nRequirements:\n` +
    '1. Use precise academic, psychological, or philosophical terminology appropriate for the context.\n' +
    '2. Maintain the scholarly tone, elegance, and depth of the original text.\n' +
    '3. Provide a brief explanation for extremely complex or culture-specific terms if necessary.\n' +
    `4. Ensure the translation is fluent and natural in ${target}, avoiding awkward translation-ese.\n` +
    '5. Format with clear paragraphs.'
  );
}

async function healthCheck(provider, baseUrl, defaultOllamaHost) {
  if (provider === 'gemini') {
    if (!geminiIsConfigured()) {
      return { success: false, message: 'Gemini is not configured on the desktop app.' };
    }
    return { success: true, message: 'Gemini service is configured on the desktop app.' };
  }

  if (provider === 'ollama-cloud') {
    let validatedHost;
    try {
      validatedHost = validateOllamaHost(baseUrl, defaultOllamaHost);
    } catch (error) {
      return { success: false, message: error.message };
    }

    if (!ollamaIsConfigured()) {
      return { success: false, message: 'Ollama is not configured on the desktop app.' };
    }

    try {
      const response = await fetch(`${validatedHost}/api/version`, {
        headers: ollamaHeaders(),
      });
      if (!response.ok) {
        throw new Error('Health check failed.');
      }
      return { success: true, message: 'Ollama endpoint is reachable and allowed.' };
    } catch {
      return { success: false, message: 'Configured Ollama endpoint is unreachable.' };
    }
  }

  return { success: false, message: 'Unknown provider.' };
}

async function streamGeminiTranslation(payload, res) {
  const stream = await getGeminiClient().models.generateContentStream({
    model: payload.model || DEFAULT_GEMINI_MODEL,
    contents: payload.text,
    config: {
      systemInstruction: buildSystemPrompt(payload),
      temperature: 0.2,
    },
  });

  for await (const chunk of stream) {
    if (chunk.text) {
      res.write(chunk.text);
    }
  }
}

function ollamaPayload(payload, defaultOllamaModel) {
  return {
    model: payload.model || defaultOllamaModel,
    messages: [
      { role: 'system', content: buildSystemPrompt(payload) },
      { role: 'user', content: `Text: ${payload.text}` },
    ],
  };
}

async function streamOllamaTranslation(payload, res, defaultOllamaHost, defaultOllamaModel) {
  const host = validateOllamaHost(payload.baseUrl, defaultOllamaHost);
  const response = await fetch(`${host}/api/chat`, {
    method: 'POST',
    headers: ollamaHeaders(),
    body: JSON.stringify({
      ...ollamaPayload(payload, defaultOllamaModel),
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || `Translation error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      const message = JSON.parse(line);
      const content = message?.message?.content;
      if (content) {
        res.write(content);
      }
    }
  }

  if (buffer.trim()) {
    const message = JSON.parse(buffer);
    const content = message?.message?.content;
    if (content) {
      res.write(content);
    }
  }
}

function createDesktopServer(port, options) {
  const openlensStaticDir = options.openlensStaticDir;
  const openlensIndexPath = `${openlensStaticDir}/index.html`;
  const openlensAssetsDir = `${openlensStaticDir}/assets`;
  const openlensConfig = getOpenLensConfig(options.openlensConfigPath);
  const defaultGeminiModel = openlensConfig.defaultGeminiModel;
  const defaultOllamaModel = openlensConfig.defaultOllamaModel;
  const defaultOllamaHost = openlensConfig.defaultOllamaHost;

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  if (fs.existsSync(openlensAssetsDir)) {
    app.use('/openlens/assets', express.static(openlensAssetsDir));
  }

  app.get('/api/openlens/health', async (req, res) => {
    const result = await healthCheck(req.query.provider, req.query.baseUrl, defaultOllamaHost);
    res.json(result);
  });

  app.post('/api/openlens/translate/stream', async (req, res) => {
    try {
      const payload = req.body || {};
      if (!payload.text || !payload.provider) {
        return res.status(400).json({ detail: 'provider and text are required.' });
      }

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      if (payload.provider === 'gemini') {
        await streamGeminiTranslation(
          { ...payload, model: payload.model || defaultGeminiModel },
          res
        );
      } else if (payload.provider === 'ollama-cloud') {
        await streamOllamaTranslation(payload, res, defaultOllamaHost, defaultOllamaModel);
      } else {
        return res.status(400).json({ detail: 'Unknown provider.' });
      }

      res.end();
    } catch (error) {
      if (!res.headersSent) {
        return res.status(500).json({ detail: error.message || 'Translation failed.' });
      }
      res.write(`\n\nError: ${error.message || 'Translation failed.'}`);
      res.end();
    }
  });

  app.get('/openlens', (_req, res) => {
    if (!fs.existsSync(openlensIndexPath)) {
      return res.status(503).send('OpenLens UI has not been built yet.');
    }

    return res.sendFile(openlensIndexPath);
  });

  app.get('/openlens/', (_req, res) => {
    if (!fs.existsSync(openlensIndexPath)) {
      return res.status(503).send('OpenLens UI has not been built yet.');
    }

    return res.sendFile(openlensIndexPath);
  });

  app.get('/', (_req, res) => {
    res.redirect('/openlens');
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(port, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

module.exports = {
  createDesktopServer,
};
