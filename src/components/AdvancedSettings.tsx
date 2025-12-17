import React from 'react';
import { Activity, Palette, Sliders, ShieldAlert, BookOpen, Scale, Calculator, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface GlobalConfig {
    broadPrompt: string;
    bookStructure: string;
    tone: string;
    toneThrottle: number;
    visualProfile: string;
    colorScheme: string;
    posibotRules: string;
    techImageRules: string;
    artisticImageRules: string;
    kdpRules: string;
    systemicAdjustments: string;
    technicalLevel: number;
    humorBalance: number;
    chapterTitlePrompt: string;
}

interface AdvancedSettingsProps {
    globalConfig: GlobalConfig;
    onConfigChange: (config: GlobalConfig) => void;
    placeholders: Record<string, string>;
    isExpanded?: boolean;
}

// Throttle (Range Slider) Component
const Throttle = ({ label, value, onChange, leftLabel, rightLabel }: any) => (
    <div className="flex items-center gap-2 w-full">
        <span className="text-[10px] text-gray-500 w-12 text-right">{leftLabel}</span>
        <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-600"
        />
        <span className="text-[10px] text-gray-500 w-12">{rightLabel}</span>
    </div>
);

export default function AdvancedSettings({
    globalConfig,
    onConfigChange,
    placeholders,
    isExpanded = false
}: AdvancedSettingsProps) {
    const [expanded, setExpanded] = React.useState(isExpanded);

    const updateConfig = (updates: Partial<GlobalConfig>) => {
        onConfigChange({ ...globalConfig, ...updates });
    };

    const handleChange = (field: keyof GlobalConfig, value: any) => {
        updateConfig({ [field]: value });
    };

    return (
        <div className="space-y-4">
            {/* Broad Directive Section */}
            <div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-3">
                    <Activity size={14} /> Broad Directive
                </h3>

                <textarea
                    value={globalConfig.broadPrompt}
                    onChange={(e) => handleChange('broadPrompt', e.target.value)}
                    placeholder={placeholders.broadPrompt}
                    className="w-full h-24 bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 focus:border-yellow-600 focus:outline-none mb-4"
                />

                {/* Visual Profile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1 mb-1">
                            <Palette size={10} /> Visual Profile (Master)
                        </label>
                        <textarea
                            value={globalConfig.visualProfile}
                            onChange={(e) => handleChange('visualProfile', e.target.value)}
                            placeholder={placeholders.visualProfile}
                            className="w-full h-20 bg-gray-900/30 border border-gray-800 rounded p-2 text-xs text-gray-300 focus:border-purple-500 focus:outline-none resize-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1 mb-1">
                            <Palette size={10} /> Color Scheme
                        </label>
                        <textarea
                            value={globalConfig.colorScheme}
                            onChange={(e) => handleChange('colorScheme', e.target.value)}
                            placeholder={placeholders.colorScheme}
                            className="w-full h-20 bg-gray-900/30 border border-gray-800 rounded p-2 text-xs text-gray-300 focus:border-purple-500 focus:outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Tone & Intensity */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1">
                            <Sliders size={10} /> Tone Profile
                        </label>
                        <input
                            value={globalConfig.tone}
                            onChange={(e) => handleChange('tone', e.target.value)}
                            placeholder={placeholders.tone}
                            className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-gray-600 mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1">
                            <Activity size={10} /> Intensity ({globalConfig.toneThrottle}%)
                        </label>
                        <Throttle
                            value={globalConfig.toneThrottle}
                            onChange={(v: number) => handleChange('toneThrottle', v)}
                            leftLabel="Mild"
                            rightLabel="Max"
                        />
                    </div>
                </div>
            </div>

            {/* Standard Rules (The "Overrides") */}
            <div className="pt-4 border-t border-gray-900">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-3">
                    <ShieldAlert size={14} /> Standard Rules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                            PosiBot Rules
                        </label>
                        <textarea
                            value={globalConfig.posibotRules}
                            onChange={(e) => handleChange('posibotRules', e.target.value)}
                            placeholder={placeholders.posibotRules}
                            className="w-full h-24 bg-gray-900/50 border border-gray-800 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500 resize-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                            Tech Image Rules
                        </label>
                        <textarea
                            value={globalConfig.techImageRules}
                            onChange={(e) => handleChange('techImageRules', e.target.value)}
                            placeholder={placeholders.techImageRules}
                            className="w-full h-24 bg-gray-900/50 border border-gray-800 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500 resize-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                            Artistic Image Rules
                        </label>
                        <textarea
                            value={globalConfig.artisticImageRules}
                            onChange={(e) => handleChange('artisticImageRules', e.target.value)}
                            placeholder={placeholders.artisticImageRules}
                            className="w-full h-24 bg-gray-900/50 border border-gray-800 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500 resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Pre-Chapter Config */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-900">
                <div className="md:col-span-2">
                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                        Universal Chapter Title Prompt
                    </label>
                    <input
                        value={globalConfig.chapterTitlePrompt}
                        onChange={(e) => handleChange('chapterTitlePrompt', e.target.value)}
                        placeholder={placeholders.chapterTitlePrompt}
                        className="w-full bg-gray-900/50 border border-gray-800 rounded px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-gray-600"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                        Structure Funnel
                    </label>
                    <input
                        value={globalConfig.bookStructure}
                        onChange={(e) => handleChange('bookStructure', e.target.value)}
                        placeholder={placeholders.bookStructure}
                        className="w-full bg-gray-900/50 border border-gray-800 rounded px-3 py-2 text-xs text-gray-500 focus:outline-none focus:border-gray-600"
                    />
                </div>
            </div>

            {/* Scales */}
            <div className="grid grid-cols-2 gap-6 pt-2 pb-4">
                <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                        Technical Level ({globalConfig.technicalLevel})
                    </label>
                    <Throttle
                        value={globalConfig.technicalLevel}
                        onChange={(v: number) => handleChange('technicalLevel', v)}
                        leftLabel="Narrative"
                        rightLabel="Academic"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                        Humor Balance ({globalConfig.humorBalance})
                    </label>
                    <Throttle
                        value={globalConfig.humorBalance}
                        onChange={(v: number) => handleChange('humorBalance', v)}
                        leftLabel="Serious"
                        rightLabel="Comedy"
                    />
                </div>
            </div>

            {/* System Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-900">
                <div>
                    <label className="text-[10px] text-red-500 uppercase font-bold block mb-1">
                        KDP Specs (Mandatory)
                    </label>
                    <textarea
                        value={globalConfig.kdpRules}
                        onChange={(e) => handleChange('kdpRules', e.target.value)}
                        placeholder={placeholders.kdpRules}
                        className="w-full h-16 bg-red-900/10 border border-red-900/30 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-red-500 resize-none"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                        Systemic Adjustments (Prompt Override)
                    </label>
                    <textarea
                        value={globalConfig.systemicAdjustments}
                        onChange={(e) => handleChange('systemicAdjustments', e.target.value)}
                        placeholder={placeholders.systemicAdjustments}
                        className="w-full h-16 bg-gray-900 border border-gray-800 rounded p-2 text-xs text-gray-300 focus:outline-none focus:border-gray-500 resize-none"
                    />
                </div>
            </div>
        </div>
    );
}
