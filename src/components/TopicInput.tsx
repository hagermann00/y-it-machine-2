import React, { useState, useEffect } from 'react';
import { Search, Database, Trash2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

interface TopicInputProps {
    topic: string;
    onTopicChange: (topic: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
    isCached: boolean;
}

const MAX_TOPIC_LENGTH = 200;

/**
 * Sanitizes text input to prevent XSS and limit length
 */
const sanitizeInput = (text: string, maxLength: number = 10000): string => {
    if (!text) return '';
    return text
        .substring(0, maxLength)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '')  // Remove javascript: URIs
        .replace(/on\w+\s*=/gi, '')    // Remove event handlers
        .trim();
};

/**
 * Sanitizes topic specifically (stricter rules, shorter limit)
 */
const sanitizeTopic = (text: string): string => {
    return sanitizeInput(text, MAX_TOPIC_LENGTH)
        .replace(/[<>]/g, ''); // Remove angle brackets entirely for topics
};

export default function TopicInput({
    topic,
    onTopicChange,
    onSubmit,
    isLoading,
    isCached
}: TopicInputProps) {
    const { clearCacheForTopic } = useProject();

    const handleClearCache = () => {
        clearCacheForTopic(sanitizeTopic(topic));
    };

    const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitized = sanitizeTopic(e.target.value);
        onTopicChange(sanitized);
    };

    return (
        <div className="flex gap-2 items-center">
            <div className="relative flex-1 group">
                <Search className={`absolute left-3 top-3 ${isCached ? 'text-yellow-500' : 'text-gray-500'} transition-colors`} size={18} />
                <input
                    type="text"
                    value={topic}
                    onChange={handleTopicChange}
                    placeholder="Enter Investigation Topic (e.g. 'Dropshipping', 'Airbnb Arbitrage')..."
                    className={`w-full bg-gray-900 border ${isCached ? 'border-yellow-500/50' : 'border-gray-700'} text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none font-bold transition-all`}
                />
                {isCached && (
                    <div className="absolute right-3 top-3.5 flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-yellow-500 tracking-wider flex items-center gap-1">
                            <Database size={10} /> Data Cached
                        </span>
                        <button
                            onClick={handleClearCache}
                            className="text-gray-600 hover:text-red-400"
                            title="Clear Cache"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}
            </div>
            <button
                onClick={onSubmit}
                disabled={isLoading || !topic}
                className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg
                    ${isCached
                        ? 'bg-gray-900 border border-yellow-500 text-yellow-500 hover:bg-gray-800 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                        : 'bg-yellow-600 text-black hover:bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                    }`}
            >
                {isLoading ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg className={`h-5 w-5 ${isCached ? "fill-yellow-500" : "fill-black"}`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                )}
                <span className="hidden md:inline">
                    {isCached ? "INSTANT LAUNCH" : "IGNITE SWARM"}
                </span>
            </button>
        </div>
    );
}
