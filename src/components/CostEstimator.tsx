import React from 'react';
import { DollarSign, Image, FileText, Mic2, AlertCircle } from 'lucide-react';
import { GenSettings } from '../types';

interface CostEstimate {
    textCost: number;
    imageCost: number;
    audioCost: number;
    totalCost: number;
    imageCount: number;
    chapterCount: number;
}

interface Props {
    settings: GenSettings;
    includePodcast?: boolean;
}

// Pricing constants (as of late 2024)
const PRICING = {
    // Per 1M tokens
    GEMINI_FLASH_INPUT: 0.075,
    GEMINI_FLASH_OUTPUT: 0.30,
    // Per image (estimated average)
    IMAGE_GENERATION: 0.035,
    // Per minute of TTS audio
    TTS_PER_MINUTE: 0.01,
};

const estimateCost = (settings: GenSettings, includePodcast: boolean): CostEstimate => {
    const chapterCount = settings.lengthLevel === 1 ? 4 : 8;

    // Estimate tokens based on chapter count and density
    // Research: ~50K input, ~10K output
    // Per chapter: ~10K input, ~5K output
    const researchInputTokens = 50000;
    const researchOutputTokens = 10000;
    const chapterInputTokens = chapterCount * 10000;
    const chapterOutputTokens = chapterCount * 5000;

    const totalInputTokens = researchInputTokens + chapterInputTokens;
    const totalOutputTokens = researchOutputTokens + chapterOutputTokens;

    const textCost = (
        (totalInputTokens / 1000000) * PRICING.GEMINI_FLASH_INPUT +
        (totalOutputTokens / 1000000) * PRICING.GEMINI_FLASH_OUTPUT
    );

    // Image count based on density setting
    // Density 1 = text-heavy (~4 images), 2 = balanced (~12), 3 = visual-heavy (~24+)
    let imageCount = 2; // Covers always
    if (settings.imageDensity === 1) {
        imageCount += chapterCount; // Just hero images
    } else if (settings.imageDensity === 2) {
        imageCount += chapterCount * 2; // Hero + 1 per chapter
    } else {
        imageCount += chapterCount * 3; // Hero + 2 per chapter
    }

    const imageCost = imageCount * PRICING.IMAGE_GENERATION;

    // Podcast cost (if enabled)
    // Estimate ~5 minutes for standard, ~10 for deep dive
    let audioCost = 0;
    if (includePodcast) {
        const minutes = settings.lengthLevel === 1 ? 2 : settings.lengthLevel === 2 ? 5 : 10;
        audioCost = minutes * PRICING.TTS_PER_MINUTE;
    }

    return {
        textCost,
        imageCost,
        audioCost,
        totalCost: textCost + imageCost + audioCost,
        imageCount,
        chapterCount
    };
};

const CostEstimator: React.FC<Props> = ({ settings, includePodcast = false }) => {
    const estimate = estimateCost(settings, includePodcast);

    const formatCurrency = (amount: number) => {
        if (amount < 0.01) return '<$0.01';
        return `$${amount.toFixed(2)}`;
    };

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                <DollarSign size={14} className="text-green-500" />
                Estimated API Cost
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-black/30 p-2 rounded flex items-center gap-2">
                    <FileText size={12} className="text-blue-400" />
                    <div>
                        <div className="text-gray-500">Text</div>
                        <div className="text-gray-300 font-mono">{formatCurrency(estimate.textCost)}</div>
                    </div>
                </div>

                <div className="bg-black/30 p-2 rounded flex items-center gap-2">
                    <Image size={12} className="text-yellow-400" />
                    <div>
                        <div className="text-gray-500">Images ({estimate.imageCount})</div>
                        <div className="text-gray-300 font-mono">{formatCurrency(estimate.imageCost)}</div>
                    </div>
                </div>

                {includePodcast && (
                    <div className="bg-black/30 p-2 rounded flex items-center gap-2">
                        <Mic2 size={12} className="text-purple-400" />
                        <div>
                            <div className="text-gray-500">Audio</div>
                            <div className="text-gray-300 font-mono">{formatCurrency(estimate.audioCost)}</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                <span className="text-sm text-gray-400">Total Estimate:</span>
                <span className="text-lg font-bold text-green-400 font-mono">
                    {formatCurrency(estimate.totalCost)}
                </span>
            </div>

            <div className="flex items-start gap-2 text-[10px] text-gray-600">
                <AlertCircle size={10} className="mt-0.5 shrink-0" />
                <span>
                    Actual costs may vary. Free tier users: This will consume ~{estimate.imageCount + estimate.chapterCount + 5} API calls.
                </span>
            </div>
        </div>
    );
};

export default CostEstimator;
export { estimateCost, type CostEstimate };
