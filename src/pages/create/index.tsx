import { Route, Routes, Navigate } from 'react-router-dom';
import CreateLayout from './CreateLayout';
import Studio from './Studio';
import AIWriter from './AIWriter';
import AIWriterV2 from './AIWriterV2';
import AIWriterEditor from './AIWriterEditor';
import AIWriterHistoryPage from './AIWriterHistoryPage';
import Wizard from '../Wizard';
import PlanLibrary from './components/PlanLibrary';
import IPIncubationSubmit from './IPIncubationSubmit';
import AgentPage from './agent';

function Create() {
  return (
    <Routes>
      {/* 独立路由 - 全屏显示，不包含 CreateLayout */}
      <Route path="ai-writer-editor" element={<AIWriterEditor />} />
      <Route path="ip-submit" element={<IPIncubationSubmit />} />
      <Route path="agent" element={<AgentPage />} />
      <Route path="inspiration" element={<AgentPage />} />

      {/* 包含 CreateLayout 的路由 */}
      <Route element={<CreateLayout />}>
        <Route index element={<Studio />} />
        <Route path="ai-writer" element={<AIWriterV2 />} />
        <Route path="ai-writer/history" element={<AIWriterHistoryPage />} />
        <Route path="ai-writer-classic" element={<AIWriter />} />
        <Route path="wizard" element={<Wizard />} />
        <Route path="plan-library" element={<PlanLibrary />} />
        <Route path="activity" element={<Navigate to="/organizer" replace />} />
      </Route>
    </Routes>
  );
}

export default Create;
