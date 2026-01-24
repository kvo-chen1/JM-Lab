import { Route, Routes } from 'react-router-dom';
import CreateLayout from './CreateLayout';
import Studio from './Studio';
import AIWriter from './AIWriter';
import Wizard from '../Wizard';
import Inspiration from '../Neo'; // Correctly point to Inspiration Engine

export default function CreateRoutes() {
  return (
    <Routes>
      <Route element={<CreateLayout />}>
        <Route index element={<Studio />} />
        <Route path="ai-writer" element={<AIWriter />} />
        <Route path="inspiration" element={<Inspiration />} />
        <Route path="wizard" element={<Wizard />} />
      </Route>
    </Routes>
  );
}
