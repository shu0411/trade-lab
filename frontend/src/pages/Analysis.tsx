import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getPatternStats, getReasonStats } from '../api/client';
import type { PatternStat, ReasonStat } from '../types/entry';

const barColor = (rate: number | null) => {
  if (rate === null) return '#d1d5db';
  if (rate >= 60) return '#16a34a';
  if (rate >= 40) return '#ca8a04';
  return '#dc2626';
};

export default function Analysis() {
  const [patterns, setPatterns] = useState<PatternStat[]>([]);
  const [reasons, setReasons] = useState<ReasonStat[]>([]);

  useEffect(() => {
    getPatternStats().then(setPatterns).catch(console.error);
    getReasonStats().then(setReasons).catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">分析</h1>

      {/* Pattern analysis */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">パターン別成功率</h2>
        {patterns.every((p) => p.total === 0) ? (
          <p className="text-gray-400 text-sm">データがありません（クローズ済みの記録が必要です）</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={patterns} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="pattern" tick={{ fontSize: 13 }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [`${v}%`, '成功率']} />
                <Bar dataKey="successRate" radius={[6, 6, 0, 0]}>
                  {patterns.map((p, i) => <Cell key={i} fill={barColor(p.successRate)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {patterns.map((p) => (
                <div key={p.pattern} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-sm text-gray-500">{p.pattern}</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: barColor(p.successRate) }}>
                    {p.successRate !== null ? `${p.successRate}%` : '—'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{p.closed}/{p.total}件</div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Reason analysis */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">根拠別成功率</h2>
        {reasons.every((r) => r.total === 0) ? (
          <p className="text-gray-400 text-sm">データがありません（クローズ済みの記録が必要です）</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={reasons} layout="vertical" barSize={22} margin={{ left: 90 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="reason" tick={{ fontSize: 12 }} width={90} />
                <Tooltip formatter={(v: number) => [`${v}%`, '成功率']} />
                <Bar dataKey="successRate" radius={[0, 6, 6, 0]}>
                  {reasons.map((r, i) => <Cell key={i} fill={barColor(r.successRate)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {reasons
                .filter((r) => r.total > 0)
                .sort((a, b) => (b.successRate ?? 0) - (a.successRate ?? 0))
                .map((r) => (
                  <div key={r.reason} className="flex items-center gap-3 text-sm">
                    <span className="w-32 text-gray-600 shrink-0">{r.reason}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${r.successRate ?? 0}%`,
                          backgroundColor: barColor(r.successRate),
                        }}
                      />
                    </div>
                    <span className="w-12 text-right font-medium" style={{ color: barColor(r.successRate) }}>
                      {r.successRate !== null ? `${r.successRate}%` : '—'}
                    </span>
                    <span className="text-xs text-gray-400">{r.closed}/{r.total}件</span>
                  </div>
                ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
