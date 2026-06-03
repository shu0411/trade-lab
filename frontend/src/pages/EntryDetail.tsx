import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEntry, updateResult, deleteEntry, getSignedReadUrl } from '../api/client';
import type { Entry, ResultUpdateForm } from '../types/entry';
import ResultForm from '../components/ResultForm';

const RESULT_LABEL: Record<string, string> = { success: '成功', failure: '失敗', breakeven: '引き分け' };
const RESULT_COLOR: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  failure: 'bg-red-100 text-red-700',
  breakeven: 'bg-gray-100 text-gray-600',
};

export default function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getEntry(id)
      .then(async (e) => {
        setEntry(e);
        if (e.chartImageKey) {
          const { url } = await getSignedReadUrl(e.chartImageKey);
          setImageUrl(url);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleResultSubmit = async (data: ResultUpdateForm) => {
    if (!id) return;
    const updated = await updateResult(id, {
      exitPrice: parseFloat(data.exitPrice),
      maxGainPct: data.maxGainPct ? parseFloat(data.maxGainPct) : undefined,
      maxLossPct: data.maxLossPct ? parseFloat(data.maxLossPct) : undefined,
      result: data.result,
      resultNote: data.resultNote,
    });
    setEntry(updated);
  };

  const handleDelete = async () => {
    if (!id || !confirm('この記録を削除しますか？')) return;
    await deleteEntry(id);
    navigate('/entries');
  };

  if (loading) return <p className="text-gray-400 text-sm">読み込み中...</p>;
  if (!entry) return <p className="text-red-400 text-sm">記録が見つかりません</p>;

  const isPass = entry.type === 'pass';

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/entries" className="text-gray-400 hover:text-gray-600 text-sm">← 一覧</Link>
        <h1 className="text-xl font-bold text-gray-800">
          {entry.tickerName}
          <span className="text-sm text-gray-400 font-normal ml-2">{entry.ticker}</span>
        </h1>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${isPass ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
          {isPass ? '見送り' : 'エントリー'}
        </span>
        {entry.result && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${RESULT_COLOR[entry.result]}`}>
            {RESULT_LABEL[entry.result]}
          </span>
        )}
      </div>

      {/* Main info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <InfoItem label="日付" value={entry.date} />
          <InfoItem label="パターン" value={entry.pattern} />
          <InfoItem label="ステータス" value={entry.status === 'open' ? 'オープン' : 'クローズ'} />
        </div>

        {!isPass && (
          <div className="grid grid-cols-3 gap-3 text-sm border-t border-gray-100 pt-4">
            <InfoItem label="エントリー価格" value={entry.entryPrice ? `${entry.entryPrice.toLocaleString()}円` : '—'} />
            <InfoItem
              label="利確目標"
              value={entry.targetPrice ? `${entry.targetPrice.toLocaleString()}円` : '—'}
              sub={entry.targetPct ? `+${entry.targetPct}%` : undefined}
              subColor="text-green-600"
            />
            <InfoItem
              label="損切目標"
              value={entry.stopPrice ? `${entry.stopPrice.toLocaleString()}円` : '—'}
              sub={entry.stopPct ? `-${entry.stopPct}%` : undefined}
              subColor="text-red-500"
            />
          </div>
        )}

        {entry.reasons.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500 mb-2">判断根拠</p>
            <div className="flex flex-wrap gap-1">
              {entry.reasons.map((r) => (
                <span key={r} className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded">{r}</span>
              ))}
            </div>
            {entry.reasonNote && <p className="text-sm text-gray-600 mt-2">{entry.reasonNote}</p>}
          </div>
        )}
      </div>

      {/* Chart image */}
      {imageUrl && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-2">チャート画像</p>
          <img src={imageUrl} alt="chart" className="w-full rounded-lg max-h-80 object-contain" />
        </div>
      )}

      {/* Result */}
      {entry.status === 'closed' ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-700">結果</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <InfoItem label="終了価格" value={entry.exitPrice ? `${entry.exitPrice.toLocaleString()}円` : '—'} />
            <InfoItem label="最大含み益" value={entry.maxGainPct ? `+${entry.maxGainPct}%` : '—'} valueColor="text-green-600" />
            <InfoItem label="最大含み損" value={entry.maxLossPct ? `${entry.maxLossPct}%` : '—'} valueColor="text-red-500" />
          </div>
          {entry.resultNote && <p className="text-sm text-gray-600 border-t border-gray-100 pt-3">{entry.resultNote}</p>}
        </div>
      ) : (
        !isPass && <ResultForm entry={entry} onSubmit={handleResultSubmit} />
      )}

      <div className="pt-2">
        <button onClick={handleDelete} className="text-sm text-red-400 hover:text-red-600 transition">
          この記録を削除
        </button>
      </div>
    </div>
  );
}

function InfoItem({
  label, value, sub, subColor = '', valueColor = 'text-gray-800',
}: { label: string; value: string; sub?: string; subColor?: string; valueColor?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`font-medium mt-0.5 ${valueColor}`}>{value}</p>
      {sub && <p className={`text-xs ${subColor}`}>{sub}</p>}
    </div>
  );
}
