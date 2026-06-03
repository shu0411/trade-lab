import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSummary, getEntries, getPatternStats } from '../api/client';
import type { Summary, Entry, PatternStat } from '../types/entry';
import EntryCard from '../components/EntryCard';

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<Entry[]>([]);
  const [patterns, setPatterns] = useState<PatternStat[]>([]);

  useEffect(() => {
    getSummary().then(setSummary).catch(console.error);
    getEntries({ type: 'entry' }).then((list) => setRecent(list.slice(0, 5))).catch(console.error);
    getPatternStats().then(setPatterns).catch(console.error);
  }, []);

  const rateColor = (rate: number | null) => {
    if (rate === null) return 'text-gray-400';
    if (rate >= 60) return 'text-green-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
        <Link
          to="/entries/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + 仮説を記録
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="総記録数" value={summary?.total ?? '-'} unit="件" />
        <StatCard label="オープン中" value={summary?.open ?? '-'} unit="件" />
        <StatCard label="クローズ済" value={summary?.closed ?? '-'} unit="件" />
        <StatCard
          label="全体成功率"
          value={summary?.successRate !== null && summary?.successRate !== undefined ? `${summary.successRate}` : '-'}
          unit="%"
          valueClass={rateColor(summary?.successRate ?? null)}
        />
      </div>

      {/* Pattern success rates */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">パターン別成功率</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {patterns.map((p) => (
            <div key={p.pattern} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-500">{p.pattern}</div>
              <div className={`text-3xl font-bold mt-1 ${rateColor(p.successRate)}`}>
                {p.successRate !== null ? `${p.successRate}%` : '—'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {p.closed}件クローズ / {p.total}件記録
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent entries */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-700">最近の記録</h2>
          <Link to="/entries" className="text-sm text-blue-600 hover:underline">すべて見る</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-gray-400 text-sm">まだ記録がありません</p>
        ) : (
          <div className="space-y-3">
            {recent.map((e) => <EntryCard key={e.id} entry={e} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, unit, valueClass = 'text-gray-800',
}: { label: string; value: string | number; unit: string; valueClass?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${valueClass}`}>
        {value}<span className="text-base font-normal text-gray-400 ml-1">{unit}</span>
      </div>
    </div>
  );
}
