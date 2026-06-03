import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEntries } from '../api/client';
import type { Entry, EntryType, Status } from '../types/entry';
import EntryCard from '../components/EntryCard';

export default function EntryList() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [typeFilter, setTypeFilter] = useState<EntryType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (typeFilter !== 'all') params.type = typeFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    getEntries(params)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [typeFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">仮説一覧</h1>
        <Link
          to="/entries/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + 仮説を記録
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">タイプ</label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(['all', 'entry', 'pass'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 transition ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {t === 'all' ? 'すべて' : t === 'entry' ? 'エントリー' : '見送り'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">ステータス</label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(['all', 'open', 'closed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 transition ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {s === 'all' ? 'すべて' : s === 'open' ? 'オープン' : 'クローズ'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">読み込み中...</p>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">記録がありません</p>
          <Link to="/entries/new" className="text-blue-500 hover:underline text-sm mt-2 block">
            最初の仮説を記録する
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => <EntryCard key={e.id} entry={e} />)}
        </div>
      )}
    </div>
  );
}
