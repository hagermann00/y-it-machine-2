import React from 'react';
import { AgentState } from '../services/orchestrator';
import { CheckCircle, Loader2, XCircle, Circle } from 'lucide-react';

interface Props {
  agents: AgentState[];
}

const AgentStatus: React.FC<Props> = ({ agents }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
      {agents.map((agent) => (
        <div 
          key={agent.name} 
          className={`flex items-center justify-between p-4 rounded-lg border ${
            agent.status === 'RUNNING' ? 'bg-yellow-900/20 border-yellow-500/50' :
            agent.status === 'COMPLETED' ? 'bg-green-900/20 border-green-500/50' :
            agent.status === 'FAILED' ? 'bg-red-900/20 border-red-500/50' :
            'bg-gray-900 border-gray-800'
          }`}
        >
          <span className="font-mono font-bold text-sm">{agent.name} Agent</span>
          
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider opacity-70">{agent.status}</span>
            {agent.status === 'PENDING' && <Circle size={16} className="text-gray-600" />}
            {agent.status === 'RUNNING' && <Loader2 size={16} className="text-yellow-500 animate-spin" />}
            {agent.status === 'COMPLETED' && <CheckCircle size={16} className="text-green-500" />}
            {agent.status === 'FAILED' && <XCircle size={16} className="text-red-500" />}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentStatus;
