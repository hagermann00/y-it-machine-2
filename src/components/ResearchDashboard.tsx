
import React, { useMemo } from 'react';
import { ResearchData, AffiliateOpp } from '../types';
import { ShieldAlert, TrendingUp, DollarSign, Users, Skull, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  data: ResearchData;
}

const ResearchDashboard: React.FC<Props> = ({ data }) => {

  const { participantAffiliates, writerAffiliates } = useMemo(() => {
    const participants: AffiliateOpp[] = [];
    const writers: AffiliateOpp[] = [];
    for (const aff of data.affiliates) {
      if (aff.type === 'PARTICIPANT') participants.push(aff);
      else if (aff.type === 'WRITER') writers.push(aff);
    }
    return { participantAffiliates: participants, writerAffiliates: writers };
  }, [data.affiliates]);
  
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-500 border-green-500';
    if (rating >= 5) return 'text-yellow-500 border-yellow-500';
    return 'text-red-500 border-red-500';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-6 border rounded-xl bg-gray-900/50 backdrop-blur-sm ${getRatingColor(data.ethicalRating)}`}>
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert size={24} />
            <h3 className="font-bold uppercase tracking-wider text-sm">Ethical Rating</h3>
          </div>
          <div className="text-5xl font-black">{data.ethicalRating}/10</div>
          <p className="text-xs opacity-70 mt-2">1 = Scam, 10 = Honest Work</p>
        </div>

        <div className="p-6 border border-gray-800 rounded-xl bg-gray-900/50 backdrop-blur-sm text-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={24} className="text-blue-500" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Profit Potential</h3>
          </div>
          <div className="text-4xl font-bold">{data.profitPotential}</div>
          <p className="text-xs opacity-70 mt-2">Based on median outcomes</p>
        </div>

        <div className="p-6 border border-gray-800 rounded-xl bg-gray-900/50 backdrop-blur-sm text-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Skull size={24} className="text-red-500" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Key Reality Stat</h3>
          </div>
          {data.marketStats.length > 0 ? (
             <div>
                <div className="text-2xl font-bold text-red-400">{data.marketStats[0].value}</div>
                <div className="text-sm font-medium mt-1">{data.marketStats[0].label}</div>
             </div>
          ) : (
            <div className="text-gray-500 italic">No data available</div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="text-yellow-500" size={20}/> 
            Executive Summary
        </h3>
        <p className="text-gray-300 leading-relaxed">{data.summary}</p>
      </div>

      {/* Case Studies */}
      <div>
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Users className="text-purple-500" />
          Analyzed Case Studies ({data.caseStudies.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.caseStudies.map((study, idx) => (
            <div key={idx} className={`p-5 rounded-lg border ${study.type === 'WINNER' ? 'border-green-900 bg-green-900/10' : 'border-red-900 bg-red-900/10'} hover:scale-[1.02] transition-transform`}>
              <div className="flex justify-between items-start mb-3">
                <span className="font-bold text-lg">{study.name}</span>
                <span className={`text-xs px-2 py-1 rounded font-bold ${study.type === 'WINNER' ? 'bg-green-500 text-black' : 'bg-red-500 text-black'}`}>
                  {study.type}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <p><strong className="text-gray-300">Background:</strong> {study.background}</p>
                <p><strong className="text-gray-300">Strategy:</strong> {study.strategy}</p>
                <p><strong className="text-gray-300">Outcome:</strong> {study.outcome}</p>
                <p className={`font-mono font-bold mt-2 ${study.type === 'WINNER' ? 'text-green-400' : 'text-red-400'}`}>
                  {study.revenue}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Affiliate Intel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                <DollarSign size={20} />
                Money For Participants
            </h3>
            <p className="text-sm text-gray-500 mb-4">Affiliate programs for people DOING the side hustle.</p>
            <div className="space-y-4">
                {participantAffiliates.map((aff, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-black/40 rounded border border-gray-800">
                        <div>
                            <div className="font-bold">{aff.program}</div>
                            <div className="text-xs text-gray-500">{aff.notes}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-green-400 font-mono text-sm">{aff.commission}</div>
                            {aff.potential && <div className="text-[10px] uppercase tracking-wider text-gray-600">{aff.potential}</div>}
                        </div>
                    </div>
                ))}
                {participantAffiliates.length === 0 && <p className="text-gray-600 italic">None detected.</p>}
            </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
                <DollarSign size={20} />
                Money For Writers/Gurus
            </h3>
            <p className="text-sm text-gray-500 mb-4">Why everyone is recommending this hustle to you.</p>
            <div className="space-y-4">
                {writerAffiliates.map((aff, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-black/40 rounded border border-gray-800">
                        <div>
                            <div className="font-bold">{aff.program}</div>
                            <div className="text-xs text-gray-500">{aff.notes}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-green-400 font-mono text-sm">{aff.commission}</div>
                            {aff.potential && <div className="text-[10px] uppercase tracking-wider text-gray-600">{aff.potential}</div>}
                        </div>
                    </div>
                ))}
                 {writerAffiliates.length === 0 && <p className="text-gray-600 italic">None detected.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchDashboard;
