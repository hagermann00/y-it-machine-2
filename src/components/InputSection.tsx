import React from 'react';
import { GenSettings, ResearchData } from '../types';
import ResearchForm from './ResearchForm';

interface InputSectionProps {
    onGenerate: (topic: string, settings: GenSettings, overrideResearch?: ResearchData | string) => void;
    isLoading: boolean;
    existingResearchTopic?: string;
    defaultSettings?: GenSettings;
}

/**
 * InputSection component
 *
 * This is the main wrapper component that composes the refactored sub-components.
 * Previously this component contained 1000+ lines of code.
 *
 * Refactoring breakdown:
 * - TopicInput.tsx: Topic input field + demo mode toggle + cache management
 * - ModelSelector.tsx: Reusable dropdown for selecting LLM models (research/writing/image/podcast)
 * - AdvancedSettings.tsx: Tone, visuals, length, image density, tech level sliders
 * - ResearchForm.tsx: Main orchestrator that handles all form logic and state management (850+ LOC)
 *
 * All functionality is preserved and the component remains backward-compatible.
 * This wrapper simply delegates to ResearchForm which handles the entire form logic.
 */
export default function InputSection({
    onGenerate,
    isLoading,
    existingResearchTopic,
    defaultSettings
}: InputSectionProps) {
    return (
        <ResearchForm
            onGenerate={onGenerate}
            isLoading={isLoading}
            existingResearchTopic={existingResearchTopic}
            defaultSettings={defaultSettings}
        />
    );
}
