import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEntry, uploadChartImage } from '../api/client';
import type { EntryType, Pattern } from '../types/entry';
import { PATTERNS, REASONS } from '../types/entry';

const today = new Date().toISOString().slice(0, 10);

export default function EntryNew() {
  const navigate = useNavigate();
  const [type, setType] = useState<EntryType>('entry');
  const [date, setDate] = useState(today);
  const [ticker, setTicker] = useState('');
  const [tickerName, setTickerName] = useState('');
  const [pattern, setPattern] = useState<Pattern>('押し目');
  const [entryPrice, setEntryPrice] = useState('');
  const [targetPct, setTargetPct] = useState('5');
  const [stopPct, setStopPct] = useState('3');
  const [holdDays, setHoldDays] = useState('5');
  const [reasons, setReasons] = useState<string[]>([]);
  const [reasonNote, setReasonNote] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const ep = parseFloat(entryPrice);
  const tp = parseFloat(targetPct);
  const sp = parseFloat(stopPct);
  const targetPrice = !isNaN(ep) && !isNaN(tp) ? Math.round(ep * (1 + tp / 100)) : null;
  const stopPrice = !isNaN(ep) && !isNaN(sp) ? Math.round(ep * (1 - sp / 100)) : null;

  const toggleReason = (r: string) => {
    setReasons((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!ticker || !tickerName) { setError('銘柄コードと銘柄名を入力してください'); return; }
    if (type === 'entry' && !entryPrice) { setError('エントリー価格を入力してください'); return; }

    setSubmitting(true);
    try {
      let chartImageKey: string | undefined;
      if (imageFile) {
        chartImageKey = await uploadChartImage(imageFile);
      }
      const body: Record<string, unknown> = {
        type, date, ticker, tickerName, pattern, reasons, reasonNote,
        ...(chartImageKey ? { chartImageKey } : {}),
      };
      if (type === 'entry') {
        body.entryPrice = parseFloat(entryPrice);
        body.targetPct = parseFloat(targetPct);
        body.stopPct = parseFloat(stopPct);
        body.holdDays = parseInt(holdDays);
      }
      const created = await createEntry(body);
      navigate(`/entries/${created.id}`);
    } catch {
      setError('登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">仮説を記録</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">タイプ</label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
            {(['entry', 'pass'] as const).map((t) => (
              <button
                key={t} type="button" onClick={() => setType(t)}
                className={`px-6 py-2 text-sm font-medium transition ${type === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {t === 'entry' ? 'エントリー' : '見送り'}
              </button>
            ))}
          </div>
        </div>

        {/* Basic info */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="日付" required>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
          </Field>
          <Field label="パターン" required>
            <select value={pattern} onChange={(e) => setPattern(e.target.value as Pattern)} className={inputCls}>
              {PATTERNS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="銘柄コード" required>
            <input value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="4062" className={inputCls} required />
          </Field>
          <Field label="銘柄名" required>
            <input value={tickerName} onChange={(e) => setTickerName(e.target.value)} placeholder="イビデン" className={inputCls} required />
          </Field>
        </div>

        {/* Entry-only fields */}
        {type === 'entry' && (
          <div className="space-y-4 bg-blue-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-800">価格設定</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="エントリー価格（円）" required>
                <input type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="9572" className={inputCls} />
              </Field>
              <Field label="保有予定日数（営業日）">
                <input type="number" value={holdDays} onChange={(e) => setHoldDays(e.target.value)}
                  placeholder="5" className={inputCls} />
              </Field>
              <Field label="利確目標（%）">
                <input type="number" step="0.1" value={targetPct}
                  onChange={(e) => setTargetPct(e.target.value)} placeholder="5" className={inputCls} />
                {targetPrice && <p className="text-xs text-green-600 mt-1">→ {targetPrice.toLocaleString()}円</p>}
              </Field>
              <Field label="損切目標（%）">
                <input type="number" step="0.1" value={stopPct}
                  onChange={(e) => setStopPct(e.target.value)} placeholder="3" className={inputCls} />
                {stopPrice && <p className="text-xs text-red-500 mt-1">→ {stopPrice.toLocaleString()}円</p>}
              </Field>
            </div>
          </div>
        )}

        {/* Reasons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">判断根拠</label>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r} type="button" onClick={() => toggleReason(r)}
                className={`text-sm px-3 py-1.5 rounded-full border transition ${
                  reasons.includes(r)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            value={reasonNote} onChange={(e) => setReasonNote(e.target.value)}
            placeholder="その他・補足メモ"
            rows={2}
            className={`${inputCls} mt-2`}
          />
        </div>

        {/* Chart image */}
        <Field label="チャート画像（任意）">
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-600" />
        </Field>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {submitting ? '登録中...' : '登録'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
