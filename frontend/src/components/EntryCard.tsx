import { Link } from 'react-router-dom';
import type { Entry } from '../types/entry';

const RESULT_LABEL: Record<string, string> = {
  success: '成功',
  failure: '失敗',
  breakeven: '引き分け',
};

const RESULT_COLOR: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  failure: 'bg-red-100 text-red-700',
  breakeven: 'bg-gray-100 text-gray-600',
};

export default function EntryCard({ entry }: { entry: Entry }) {
  const isPass = entry.type === 'pass';

  return (
    <Link to={`/entries/${entry.id}`} className="block">
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-800">{entry.tickerName}</span>
              <span className="text-xs text-gray-400">{entry.ticker}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPass ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}
              >
                {isPass ? '見送り' : 'エントリー'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {entry.pattern}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">{entry.date}</div>
          </div>

          <div className="text-right shrink-0">
            {entry.result ? (
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${RESULT_COLOR[entry.result]}`}
              >
                {RESULT_LABEL[entry.result]}
              </span>
            ) : (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-500 font-medium">
                オープン
              </span>
            )}
            {entry.entryPrice && (
              <div className="text-xs text-gray-400 mt-1">
                {entry.entryPrice.toLocaleString()}円
              </div>
            )}
          </div>
        </div>

        {entry.reasons.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {entry.reasons.slice(0, 3).map((r) => (
              <span
                key={r}
                className="text-xs bg-gray-50 border border-gray-200 text-gray-500 px-2 py-0.5 rounded"
              >
                {r}
              </span>
            ))}
            {entry.reasons.length > 3 && (
              <span className="text-xs text-gray-400">+{entry.reasons.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
