import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import EntryList from './pages/EntryList';
import EntryNew from './pages/EntryNew';
import EntryDetail from './pages/EntryDetail';
import Analysis from './pages/Analysis';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-gray-600 hover:bg-gray-100'
  }`;

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
          <div>
            <span className="text-xl font-bold text-blue-700">Trade Lab</span>
            <span className="ml-2 text-xs text-gray-400 hidden sm:inline">投資判断の仮説検証ツール</span>
          </div>
          <nav className="flex gap-1 ml-4">
            <NavLink to="/" end className={navClass}>ダッシュボード</NavLink>
            <NavLink to="/entries" className={navClass}>仮説一覧</NavLink>
            <NavLink to="/analysis" className={navClass}>分析</NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/entries" element={<EntryList />} />
          <Route path="/entries/new" element={<EntryNew />} />
          <Route path="/entries/:id" element={<EntryDetail />} />
          <Route path="/analysis" element={<Analysis />} />
        </Routes>
      </main>
    </div>
  );
}
