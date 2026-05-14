
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TwoD from './2D';
import Editor from './Editor';
import Config from './Config';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/2d" replace />} />
        <Route path="/2d" element={<Config/>} />
        <Route path="/3d" element={<Editor />} />
      </Routes>
    </Router>
  );
}
