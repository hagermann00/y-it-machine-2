import React, { Suspense, lazy } from 'react';
import { ResearchData } from '../types';

// Lazy load the actual ResearchDashboard which uses recharts
const ResearchDashboardContent = lazy(() => import(
  /* webpackChunkName: "recharts-dashboard" */
  "./ResearchDashboard"
));

interface Props {
  data: ResearchData;
}

const ResearchDashboardFallback: React.FC = () => (
  <div className="space-y-8 animate-fadeIn">
    <div className="h-40 bg-gray-800 rounded-xl animate-pulse"></div>
    <div className="h-40 bg-gray-800 rounded-xl animate-pulse"></div>
  </div>
);

const ResearchDashboardLazy: React.FC<Props> = ({ data }) => {
  return (
    <Suspense fallback={<ResearchDashboardFallback />}>
      <ResearchDashboardContent data={data} />
    </Suspense>
  );
};

export default ResearchDashboardLazy;
