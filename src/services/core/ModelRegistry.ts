
export type ProviderID = 'openai' | 'anthropic' | 'google';

export interface ModelCapability {
    name: 'text' | 'image' | 'audio' | 'video' | 'tools' | 'json_mode' | 'thinking';
}

export interface ModelPricing {
    inputPer1M: number;
    outputPer1M: number;
    cachedInputPer1M?: number;
}

export interface ModelDefinition {
    id: string;
    provider: ProviderID;
    displayName: string;
    contextWindow: number;
    pricing: ModelPricing;
    capabilities: ModelCapability['name'][];
    isVisual: boolean; // Accepts image inputs
    isLegacy?: boolean;
}

export const MODELS: ModelDefinition[] = [
    // --- ANTHROPIC ---
    {
        id: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        displayName: 'Claude 3.5 Sonnet',
        contextWindow: 200000,
        pricing: { inputPer1M: 3.00, outputPer1M: 15.00 },
        capabilities: ['text', 'tools', 'json_mode', 'thinking'],
        isVisual: true
    },
    {
        id: 'claude-3-5-haiku-20241022',
        provider: 'anthropic',
        displayName: 'Claude 3.5 Haiku',
        contextWindow: 200000,
        pricing: { inputPer1M: 0.80, outputPer1M: 4.00 },
        capabilities: ['text', 'tools', 'json_mode'],
        isVisual: false
    },

    {
        id: 'claude-3-opus-20240229',
        provider: 'anthropic',
        displayName: 'Claude 3 Opus',
        contextWindow: 200000,
        pricing: { inputPer1M: 15.00, outputPer1M: 75.00 },
        capabilities: ['text', 'tools', 'json_mode', 'thinking'],
        isVisual: true
    },

    // --- OPENAI ---
    {
        id: 'gpt-4o',
        provider: 'openai',
        displayName: 'GPT-4o',
        contextWindow: 128000,
        pricing: { inputPer1M: 2.50, outputPer1M: 10.00 },
        capabilities: ['text', 'tools', 'json_mode', 'image'],
        isVisual: true
    },
    {
        id: 'gpt-4o-mini',
        provider: 'openai',
        displayName: 'GPT-4o Mini',
        contextWindow: 128000,
        pricing: { inputPer1M: 0.15, outputPer1M: 0.60 },
        capabilities: ['text', 'tools', 'json_mode', 'image'],
        isVisual: true
    },
    {
        id: 'dall-e-3',
        provider: 'openai',
        displayName: 'DALL-E 3',
        contextWindow: 0,
        pricing: { inputPer1M: 0, outputPer1M: 0 }, // Specific per-image pricing
        capabilities: ['image'],
        isVisual: false
    },

    // --- GOOGLE ---
    {
        id: 'gemini-1.5-pro-002',
        provider: 'google',
        displayName: 'Gemini 1.5 Pro',
        contextWindow: 2000000,
        pricing: { inputPer1M: 1.25, outputPer1M: 5.00 },
        capabilities: ['text', 'tools', 'json_mode', 'thinking', 'audio'],
        isVisual: true
    },
    {
        id: 'gemini-1.5-flash-002',
        provider: 'google',
        displayName: 'Gemini 1.5 Flash',
        contextWindow: 1000000,
        pricing: { inputPer1M: 0.10, outputPer1M: 0.40 },
        capabilities: ['text', 'tools', 'json_mode', 'audio'],
        isVisual: true
    },
    {
        id: 'gemini-2.0-flash-exp', // Experimental latest
        provider: 'google',
        displayName: 'Gemini 2.0 Flash (Exp)',
        contextWindow: 1000000,
        pricing: { inputPer1M: 0, outputPer1M: 0 }, // Currently free in preview
        capabilities: ['text', 'tools', 'audio', 'video'],
        isVisual: true
    }
];

export const getModel = (id: string): ModelDefinition | undefined => {
    return MODELS.find(m => m.id === id);
};

export const getModelsByProvider = (provider: ProviderID): ModelDefinition[] => {
    return MODELS.filter(m => m.provider === provider);
};
