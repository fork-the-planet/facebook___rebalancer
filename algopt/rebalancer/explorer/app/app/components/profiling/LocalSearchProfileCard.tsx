'use client';

import {useMemo} from 'react';

import {Card, CardContent, CardHeader, Typography} from '@mui/material';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type {LocalSearchProfile} from '@/lib/rebalancer-explorer-types';

const COLORS = [
  '#1976d2',
  '#d32f2f',
  '#388e3c',
  '#f57c00',
  '#7b1fa2',
  '#0097a7',
  '#c2185b',
  '#455a64',
  '#5d4037',
  '#00796b',
];

interface LineRow {
  time: number;
  [moveTypeName: string]: number | null;
}

interface PieDatum {
  name: string;
  value: number;
}

/**
 * Build the line-chart dataset by walking events in order.
 *
 * Mirrors the legacy Plotly trace builder: when the move type changes between
 * consecutive events we inject a point at `(t, initialValue)` for the new
 * trace so the series for that move type begins at the transition point
 * rather than at the end of its first event. With `connectNulls={false}`,
 * recharts then draws gaps wherever a series has no value.
 */
function buildObjectiveOverTime(profile: LocalSearchProfile): LineRow[] {
  const {moveTypeNames, moveTypeEvents} = profile;
  const rows: LineRow[] = [];
  let totalDuration = 0;
  let lastIndex = -1;

  for (const event of moveTypeEvents) {
    const name =
      moveTypeNames[event.moveTypeIndex] ?? `unknown_${event.moveTypeIndex}`;
    if (event.moveTypeIndex !== lastIndex) {
      rows.push({time: totalDuration, [name]: event.initialValue});
      lastIndex = event.moveTypeIndex;
    }
    totalDuration += event.duration;
    rows.push({time: totalDuration, [name]: event.finalValue});
  }
  return rows;
}

function buildTimeByMoveType(profile: LocalSearchProfile): PieDatum[] {
  const totals = new Map<number, number>();
  for (const event of profile.moveTypeEvents) {
    totals.set(
      event.moveTypeIndex,
      (totals.get(event.moveTypeIndex) ?? 0) + event.duration,
    );
  }
  return Array.from(totals.entries())
    .map(([index, value]) => ({
      name: profile.moveTypeNames[index] ?? `unknown_${index}`,
      value,
    }))
    .filter(d => d.value > 0);
}

function buildDecreaseByMoveType(profile: LocalSearchProfile): PieDatum[] {
  const totals = new Map<number, number>();
  for (const event of profile.moveTypeEvents) {
    const decrease = Math.max(0, event.initialValue - event.finalValue);
    totals.set(
      event.moveTypeIndex,
      (totals.get(event.moveTypeIndex) ?? 0) + decrease,
    );
  }
  return Array.from(totals.entries())
    .map(([index, value]) => ({
      name: profile.moveTypeNames[index] ?? `unknown_${index}`,
      value,
    }))
    .filter(d => d.value > 0);
}

function formatNumber(value: number | string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(4);
}

interface LocalSearchProfileCardProps {
  goalIndex: number;
  profile: LocalSearchProfile;
}

export default function LocalSearchProfileCard({
  goalIndex,
  profile,
}: LocalSearchProfileCardProps) {
  const lineData = useMemo(() => buildObjectiveOverTime(profile), [profile]);
  const timeData = useMemo(() => buildTimeByMoveType(profile), [profile]);
  const decreaseData = useMemo(
    () => buildDecreaseByMoveType(profile),
    [profile],
  );

  const moveTypeNames = profile.moveTypeNames;
  const eventCount = profile.moveTypeEvents.length;

  const colorFor = (name: string): string => {
    const idx = moveTypeNames.indexOf(name);
    return COLORS[(idx >= 0 ? idx : 0) % COLORS.length];
  };

  return (
    <Card>
      <CardHeader title={`Profile (Goal Index: ${goalIndex})`} />
      <CardContent>
        <Typography variant="body2" gutterBottom>
          Events: {eventCount}
        </Typography>

        {eventCount === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No events recorded for this objective.
          </Typography>
        ) : (
          <>
            <Typography
              variant="subtitle2"
              align="center"
              gutterBottom
              sx={{mt: 2}}>
              Objective value over time
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  label={{
                    value: 'Time (seconds)',
                    position: 'insideBottom',
                    offset: -5,
                  }}
                  tickFormatter={formatNumber}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  label={{
                    value: 'Objective value',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                  tickFormatter={formatNumber}
                />
                <Tooltip
                  formatter={(value: number | string) => formatNumber(value)}
                  labelFormatter={(label: number) =>
                    `Time: ${formatNumber(label)}s`
                  }
                />
                <Legend />
                {moveTypeNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={COLORS[i % COLORS.length]}
                    dot={false}
                    strokeWidth={2}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Typography variant="subtitle2" align="center" gutterBottom>
                  Time spent by move type
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={timeData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={110}
                      label={(entry: {name?: string}) => entry.name ?? ''}
                      isAnimationActive={false}>
                      {timeData.map(entry => (
                        <Cell key={entry.name} fill={colorFor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | string) =>
                        formatNumber(value)
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div>
                <Typography variant="subtitle2" align="center" gutterBottom>
                  Objective decrease by move type
                </Typography>
                {decreaseData.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center">
                    No positive objective decreases recorded.
                  </Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={decreaseData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={110}
                        label={(entry: {name?: string}) => entry.name ?? ''}
                        isAnimationActive={false}>
                        {decreaseData.map(entry => (
                          <Cell key={entry.name} fill={colorFor(entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number | string) =>
                          formatNumber(value)
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
