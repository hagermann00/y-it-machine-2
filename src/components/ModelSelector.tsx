import React from 'react';
import { MODELS } from '../services/core/ModelRegistry';

interface ModelSelectorProps {
    label: string;
    value: string;
    onChange: (modelId: string) => void;
    filterCapability?: string; // e.g., 'text', 'image'
    disabled?: boolean;
    description?: string;
    color?: string; // Tailwind color class for the label
}

export default function ModelSelector({
    label,
    value,
    onChange,
    filterCapability,
    disabled = false,
    description,
    color = 'text-gray-400'
}: ModelSelectorProps) {
    const filteredModels = filterCapability
        ? MODELS.filter(m => m.capabilities.includes(filterCapability) || (filterCapability === 'image' && m.id === 'dall-e-3'))
        : MODELS;

    return (
        <div className="space-y-2">
            <label className={`text-[10px] ${color} font-bold uppercase block`}>
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={`w-full bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 p-2 focus:outline-none
                    ${disabled
                        ? 'bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed'
                        : 'focus:border-blue-500 hover:border-gray-600'
                    }`}
            >
                {filteredModels.map(m => (
                    <option key={m.id} value={m.id}>
                        {m.displayName} {m.pricing ? `($${m.pricing.inputPer1M}/M)` : ''}
                    </option>
                ))}
            </select>
            {description && (
                <p className="text-[9px] text-gray-600">{description}</p>
            )}
        </div>
    );
}
