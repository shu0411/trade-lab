import { useState } from 'react';
import type { Entry, Result, ResultUpdateForm } from '../types/entry';

interface Props {
  entry: Entry;
  onSubmit: (data: ResultUpdateForm) => Promise<void>;
}

export default function ResultForm({ entry, onSubmit }: Props) {
  const [exitPrice, setExitPrice] = useState('');
  const [maxGainPct, setMaxGainPct] = useState('');
  const [maxLossPct, setMaxLossPct] = useState('');
  const [result, setResult] = useState<Result>('success');
  const [resultNote, setResultNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const ep = parseFloat(exitPrice);
  const base = entry.entryPrice;
  const autoResult: Result | null =
    base && !isNaN(ep) ? (ep > base ? 'success' : ep < base ? 'failure' : 'breakeven') : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitPrice) return;
    setSubmitting(true);
    await onSubmit({ exitPrice, maxGainPct, maxLossPct, result, resultNote });
    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-200"
    >
      <h3 className="font-semibold text-gray-700">結果を記録</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            終了価格（円）<span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="number"
            value={exitPrice}
            onChange={(e) => setExitPrice(e.target.value)}
            placeholder="10050"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {autoResult && (
            <p className="text-xs mt-1 text-gray-500">
              損益: {base ? `${(((ep - base) / base) * 100).toFixed(1)}%` : ''}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">判定</label>
          <select
            value={result}
            onChange={(e) => setResult(e.target.value as Result)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="success">成功</option>
            <option value="failure">失敗</option>
            <option value="breakeven">引き分け</option>
          </select>
          {autoResult && result !== autoResult && (
            <p className="text-xs text-orange-500 mt-1">
              自動判定:{' '}
              {autoResult === 'success' ? '成功' : autoResult === 'failure' ? '失敗' : '引き分け'}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">最大含み益（%）</label>
          <input
            type="number"
            step="0.1"
            value={maxGainPct}
            onChange={(e) => setMaxGainPct(e.target.value)}
            placeholder="+7.2"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">最大含み損（%）</label>
          <input
            type="number"
            step="0.1"
            value={maxLossPct}
            onChange={(e) => setMaxLossPct(e.target.value)}
            placeholder="-1.5"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">振り返りメモ</label>
        <textarea
          value={resultNote}
          onChange={(e) => setResultNote(e.target.value)}
          rows={2}
          placeholder="エントリータイミングが良かった"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
      >
        {submitting ? '保存中...' : '結果を保存'}
      </button>
    </form>
  );
}
