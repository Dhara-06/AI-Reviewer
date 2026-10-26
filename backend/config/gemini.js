const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const getGeminiClient = () => {
  if (genAI) return genAI;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || process.env.MOCK_GEMINI === 'true') {
    return null;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    return genAI;
  } catch (err) {
    console.error('[Gemini] Failed to initialize GoogleGenerativeAI client:', err.message);
    return null;
  }
};

const getGeminiModel = (modelName = 'gemini-1.5-flash') => {
  const client = getGeminiClient();
  if (!client) return null;
  return client.getGenerativeModel({ model: process.env.GEMINI_MODEL || modelName });
};

module.exports = {
  getGeminiClient,
  getGeminiModel,
};
