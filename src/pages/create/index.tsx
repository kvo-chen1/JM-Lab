import { Route, Routes } from 'react-router-dom';
import CreateLayout from './CreateLayout';
import Studio from './Studio';
import AIWriter from './AIWriter';
import AIWriterV2 from './AIWriterV2';
import AIWriterEditor from './AIWriterEditor';
import AIWriterHistoryPage from './AIWriterHistoryPage';
import Wizard from '../Wizard';
import PlanLibrary from './components/PlanLibrary';
import CreateActivity from '../CreateActivity';

function Create() {
  return (
    <Routes>
      {/* 独立路由 - 全屏显示，不包含 CreateLayout */}
      <Route path="ai-writer-editor" element={<AIWriterEditor />} />
      
      {/* 包含 CreateLayout 的路由 */}
      <Route element={<CreateLayout />}>
        <Route index element={<Studio />} />
        <Route path="ai-writer" element={<AIWriterV2 />} />
        <Route path="ai-writer/history" element={<AIWriterHistoryPage />} />
        <Route path="ai-writer-classic" element={<AIWriter />} />
        <Route path="wizard" element={<Wizard />} />
        <Route path="plan-library" element={<PlanLibrary />} />
        <Route path="activity" element={<CreateActivity />} />
      </Route>
    </Routes>
  );
}

export default Create;
