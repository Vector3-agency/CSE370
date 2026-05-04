import { useState, useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

/* ============================================================
   PERFORMANCE LINE CHART
   ============================================================ */

interface PerformanceLineChartProps {
  timeFilter?: string;
  data?: any[];
  loading?: boolean;
}

export const PerformanceLineChart = ({ timeFilter, data: propData, loading }: PerformanceLineChartProps) => {
   const { theme } = useTheme();
   const isDark = theme === 'dark';
   const gridColor = isDark ? '#334155' : '#f1f5f9';
   const textColor = isDark ? '#94a3b8' : '#64748b';
   const tooltipBg = isDark ? '#1e293b' : '#0f172a';
   const tooltipBorder = isDark ? '#334155' : '#1e293b';

  // ── All hooks must be declared before any early returns ──
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimProgress(1), 100);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getDataByTimeFilter = () => {
    if (propData) return propData;
    
    switch (timeFilter) {
      case 'Week':
        return [
          { day: 'Mon', accuracy: 65, questions: 25 },
          { day: 'Tue', accuracy: 68, questions: 30 },
          { day: 'Wed', accuracy: 62, questions: 28 },
          { day: 'Thu', accuracy: 70, questions: 32 },
          { day: 'Fri', accuracy: 75, questions: 35 },
          { day: 'Sat', accuracy: 72, questions: 20 },
          { day: 'Sun', accuracy: 78, questions: 15 },
        ];
      case 'Month':
        return [
          { week: 'W1', accuracy: 62, questions: 120 },
          { week: 'W2', accuracy: 68, questions: 140 },
          { week: 'W3', accuracy: 70, questions: 155 },
          { week: 'W4', accuracy: 75, questions: 180 },
        ];
      case 'Year':
        return [
          { month: 'Feb', accuracy: 58, questions: 280 },
          { month: 'Mar', accuracy: 62, questions: 320 },
          { month: 'Apr', accuracy: 65, questions: 350 },
          { month: 'May', accuracy: 68, questions: 380 },
          { month: 'Jun', accuracy: 70, questions: 410 },
          { month: 'Jul', accuracy: 72, questions: 440 },
          { month: 'Aug', accuracy: 75, questions: 470 },
          { month: 'Sep', accuracy: 73, questions: 490 },
          { month: 'Oct', accuracy: 76, questions: 520 },
          { month: 'Nov', accuracy: 78, questions: 550 },
          { month: 'Dec', accuracy: 80, questions: 580 },
          { month: 'Jan', accuracy: 82, questions: 600 },
        ];
      case 'All Time':
      default:
        return [
          { year: '2021', accuracy: 45, questions: 500 },
          { year: '2022', accuracy: 58, questions: 1800 },
          { year: '2023', accuracy: 68, questions: 3200 },
          { year: '2024', accuracy: 75, questions: 4500 },
          { year: '2025', accuracy: 82, questions: 5800 },
        ];
    }
  };

  // ── Early returns AFTER all hooks ──
  if (loading) {
    return (
      <div className="w-full h-[260px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  const data = getDataByTimeFilter();
  
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[260px] flex items-center justify-center text-slate-400 text-sm">
        No data available for this period
      </div>
    );
  }

  const labelKey = timeFilter === 'Week' ? 'day' : timeFilter === 'Month' ? 'week' : timeFilter === 'Year' ? 'month' : 'year';

  const chartW = 600;
  const chartH = 220;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const minVal = 0;
  const maxVal = 100;

  const points = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * innerW,
    y: padT + innerH - ((d.accuracy - minVal) / (maxVal - minVal)) * innerH,
    ...d,
  }));

  const linePath = points.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (p.x - prev.x) * 0.4;
    const cpx2 = prev.x + (p.x - prev.x) * 0.6;
    return `C ${cpx1} ${prev.y} ${cpx2} ${p.y} ${p.x} ${p.y}`;
  }).join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padT + innerH} L ${points[0].x} ${padT + innerH} Z`;

  const gridLines = [0, 25, 50, 75, 100];

return (
    <div className="w-full">
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <span className="text-xs text-slate-500 font-medium">Accuracy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-xs text-slate-500 font-medium">Questions Completed</span>
        </div>
      </div>
      <div 
        className="relative"
        onMouseLeave={() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            setHoveredIdx(null);
            timeoutRef.current = null;
          }, 200);
        }}
        onMouseEnter={() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }}
      >
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto" style={{ maxHeight: '260px' }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {gridLines.map((val) => {
            const y = padT + innerH - ((val - minVal) / (maxVal - minVal)) * innerH;
            return (
              <g key={val}>
                 <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke={gridColor} strokeWidth="1" strokeDasharray="4 4" />
                 <text x={padL - 8} y={y + 4} textAnchor="end" className="text-[10px] font-mono" fill={textColor}>{val}%</text>
               </g>
            );
          })}

{/* Month labels */}
          {points.map((p, i) => (
            <text key={i} x={p.x} y={chartH - 8} textAnchor="middle" className="text-[11px] font-medium" fill={textColor} style={{ fontFamily: 'DM Sans' }}>
               {p[labelKey as keyof typeof p] as unknown as string}
             </text>
          ))}

          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#areaGradient)"
            opacity={animProgress}
            style={{ transition: 'opacity 0.8s ease-out' }}
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 1200,
              strokeDashoffset: animProgress ? 0 : 1200,
              transition: 'stroke-dashoffset 1.5s ease-out',
            }}
          />

          {/* Hover vertical line */}
          {hoveredIdx !== null && (
            <line
              x1={points[hoveredIdx].x}
              y1={padT}
              x2={points[hoveredIdx].x}
              y2={padT + innerH}
              stroke="#6366f1"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.4"
            />
          )}

          {/* Question bar indicators */}
          {points.map((p, i) => {
            const barH = (data[i].questions / 350) * 30;
            return (
              <rect
                key={`bar-${i}`}
                x={p.x - 6}
                y={padT + innerH - barH}
                width={12}
                height={barH}
                rx={3}
                fill="#10b981"
                opacity={hoveredIdx === i ? 0.7 : 0.25}
                className="transition-opacity duration-200"
              />
            );
          })}

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i}>
<circle cx={p.x} cy={p.y} r={hoveredIdx === i ? 7 : 5} fill={isDark ? "#1e293b" : "white"} stroke="#6366f1" strokeWidth="2.5"
                 className="transition-all duration-200 cursor-pointer"
                filter={hoveredIdx === i ? "url(#glow)" : undefined}
                onMouseEnter={() => setHoveredIdx(i)}
              />
              {hoveredIdx === i && (
                <circle cx={p.x} cy={p.y} r={12} fill="#6366f1" opacity="0.1" />
              )}
            </g>
          ))}
        </svg>

{/* Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute px-4 py-3 rounded-xl shadow-2xl pointer-events-none z-50 min-w-[160px] border"
             style={{
               left: `${points[hoveredIdx].x - 40}px`,
               top: `${points[hoveredIdx].y - 70}px`,
               backgroundColor: tooltipBg,
               borderColor: tooltipBorder,
               color: 'white'
             }}
          >
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-heading font-bold mb-1.5">{data[hoveredIdx][labelKey as keyof typeof data[0]] as unknown as string}</p>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
              <span className="text-xs text-slate-300">Accuracy</span>
              <span className="text-sm font-extrabold ml-auto font-heading tabular-nums">{data[hoveredIdx].accuracy}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-xs text-slate-300">Questions</span>
              <span className="text-sm font-extrabold ml-auto font-heading tabular-nums">{data[hoveredIdx].questions}</span>
            </div>
            </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================
   SUBJECT RADAR CHART
   ============================================================ */

interface SubjectRadarChartProps {
  data?: { system: string; accuracy: number; total_attempts: number }[];
}

export const SubjectRadarChart = ({ data: propData }: SubjectRadarChartProps) => {
   const { theme } = useTheme();
   const isDark = theme === 'dark';
   const gridColor = isDark ? '#334155' : '#e2e8f0';
   const textColor = isDark ? '#94a3b8' : '#475569';
   const defaultSubjects = [
    { name: 'Cardio', value: 82, color: '#ef4444' },
    { name: 'Neuro', value: 62, color: '#6366f1' },
    { name: 'Pharm', value: 75, color: '#8b5cf6' },
    { name: 'Biochem', value: 48, color: '#f59e0b' },
    { name: 'Micro', value: 68, color: '#10b981' },
    { name: 'Path', value: 72, color: '#06b6d4' },
  ];

  const subjects = propData && propData.length > 0
    ? propData.slice(0, 6).map((d, i) => ({
        name: d.system,
        value: d.accuracy,
        color: defaultSubjects[i % defaultSubjects.length].color // Use default colors for now
      }))
    : []; // Don't allow fallback to defaultSubjects if we want to show "No Data"

  if (subjects.length === 0) {
    return (
      <div className="w-full h-[230px] flex items-center justify-center text-slate-400 text-sm">
        No proficiency data available
      </div>
    );
  }

  const cx = 120;
  const cy = 110;
  const maxR = 80;
  const levels = [25, 50, 75, 100];
  const n = subjects.length;

  const getPoint = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle - Math.PI / 2),
    y: cy + radius * Math.sin(angle - Math.PI / 2),
  });

  const polygonPoints = subjects.map((s, i) => {
    const angle = (2 * Math.PI * i) / n;
    const r = (s.value / 100) * maxR;
    const p = getPoint(angle, r);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 240 230" className="w-full h-auto" style={{ maxHeight: '230px' }}>
        <defs>
          <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Grid levels */}
        {levels.map((level) => {
          const r = (level / 100) * maxR;
          const pts = Array.from({ length: n }).map((_, i) => {
            const angle = (2 * Math.PI * i) / n;
            const p = getPoint(angle, r);
            return `${p.x},${p.y}`;
           }).join(' ');
           return (
             <polygon key={level} points={pts} fill="none" stroke={gridColor} strokeWidth="1" opacity={level === 100 ? 0.8 : 0.5} />
           );
         })}
 
         {/* Axis lines */}
         {subjects.map((_, i) => {
           const angle = (2 * Math.PI * i) / n;
           const p = getPoint(angle, maxR);
           return (
             <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={gridColor} strokeWidth="1" />
           );
         })}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="url(#radarFill)"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Data points + labels */}
        {subjects.map((s, i) => {
          const angle = (2 * Math.PI * i) / n;
          const r = (s.value / 100) * maxR;
          const p = getPoint(angle, r);
          const labelP = getPoint(angle, maxR + 22);
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} fill={isDark ? "#1e293b" : "white"} stroke={s.color} strokeWidth="2.5" />
               <text x={labelP.x} y={labelP.y} textAnchor="middle" dominantBaseline="central"
                 className="text-[10px] font-semibold" fill={textColor} style={{ fontFamily: 'Plus Jakarta Sans' }}>
                 {s.name}
               </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ============================================================
   WEEKLY BAR CHART
   ============================================================ */

interface WeeklyBarChartProps {
  data?: { activity_date: string; question_count: number; correct_count?: number }[];
}

export const WeeklyBarChart = ({ data: propData }: WeeklyBarChartProps) => {
   const { theme } = useTheme();
   const isDark = theme === 'dark';
   const gridColor = isDark ? '#334155' : '#f1f5f9';
   const textColor = isDark ? '#94a3b8' : '#cbd5e1';
 
   // Process data if provided, otherwise use mock
  const chartData = propData && propData.length > 0
    ? propData.map(d => ({
        day: d.activity_date,
        questions: d.question_count,
        correct: d.correct_count ?? Math.floor(d.question_count * 0.7), 
        amt: 100
      }))
    : [
      { day: 'Mon', questions: 12, correct: 8, amt: 100 },
      { day: 'Tue', questions: 19, correct: 15, amt: 100 },
      { day: 'Wed', questions: 3, correct: 1, amt: 100 },
      { day: 'Thu', questions: 25, correct: 20, amt: 100 },
      { day: 'Fri', questions: 42, correct: 35, amt: 100 },
      { day: 'Sat', questions: 30, correct: 25, amt: 100 },
      { day: 'Sun', questions: 16, correct: 10, amt: 100 },
    ];

  const days = chartData.map(d => d.day);
  const correct = chartData.map(d => d.correct);
  const incorrect = chartData.map(d => d.questions - d.correct);
  const maxVal = Math.max(...chartData.map(d => d.questions), 35); // Ensure a minimum max value
  const w = 420;
  const h = 140;
  const padX = 30;
  const padY = 16;

  const getX = (i: number) => padX + (i / (days.length - 1)) * (w - padX * 2);
  const getY = (val: number) => h - padY - (val / maxVal) * (h - padY * 2);

  const correctPoints = correct.map((v, i) => ({ x: getX(i), y: getY(v) }));
  const incorrectPoints = incorrect.map((v, i) => ({ x: getX(i), y: getY(v) }));

  const makeLine = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  const makeArea = (pts: { x: number; y: number }[]) =>
    `${makeLine(pts)} L${pts[pts.length - 1].x},${h - padY} L${pts[0].x},${h - padY} Z`;

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#86efac' }}></div>
          <span className="text-[10px] text-slate-500 font-medium">Correct</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fca5a5' }}></div>
          <span className="text-[10px] text-slate-500 font-medium">Incorrect</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <defs>
          <linearGradient id="correctGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86efac" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#86efac" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="incorrectGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fca5a5" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 10, 20, 30].map(tick => {
           const y = getY(tick);
           return (
             <g key={tick}>
               <line x1={padX} y1={y} x2={w - padX} y2={y} stroke={gridColor} strokeWidth="1" />
               <text x={padX - 6} y={y + 3} textAnchor="end" className="text-[9px]" fill={textColor}>{tick}</text>
             </g>
           );
         })}
        {/* Areas */}
        <path d={makeArea(correctPoints)} fill="url(#correctGrad)" />
        <path d={makeArea(incorrectPoints)} fill="url(#incorrectGrad)" />
        {/* Lines */}
        <path d={makeLine(correctPoints)} fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={makeLine(incorrectPoints)} fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
         {correctPoints.map((p, i) => (
           <circle key={`c${i}`} cx={p.x} cy={p.y} r="3.5" fill={isDark ? "#1e293b" : "white"} stroke="#4ade80" strokeWidth="2" />
         ))}
         {incorrectPoints.map((p, i) => (
           <circle key={`i${i}`} cx={p.x} cy={p.y} r="3.5" fill={isDark ? "#1e293b" : "white"} stroke="#f87171" strokeWidth="2" />
         ))}
        {/* Day labels */}
        {days.map((day, i) => (
           <text key={day} x={getX(i)} y={h - 2} textAnchor="middle" className="text-[10px] font-medium" fill={textColor}>{day}</text>
         ))}
      </svg>
    </div>
  );
};

/* ============================================================
   MINI SPARKLINE
   ============================================================ */

export const MiniSparkline = ({ data, color = '#6366f1', height = 32 }: { data: number[]; color?: string; height?: number }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));
  const pathD = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    return `C ${prev.x + (p.x - prev.x) * 0.5} ${prev.y} ${prev.x + (p.x - prev.x) * 0.5} ${p.y} ${p.x} ${p.y}`;
  }).join(' ');
  const areaD = `${pathD} L ${w} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-20" style={{ height }}>
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={color} />
    </svg>
  );
};

/* ============================================================
   STAT CARD
   ============================================================ */

export const StatCard = ({ icon: Icon, label, value, trend, trendUp, prefix = "", sparkData, sparkColor }: {
  icon: typeof LayoutDashboard,
  label: string,
  value: string,
  trend: string,
  trendUp: boolean,
  prefix?: string,
  sparkData?: number[],
   sparkColor?: string,
 }) => (
   <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow group">
     <div className="flex justify-between items-start mb-4">
       <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-sm">
         <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
           <Icon size={16} className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
         </div>
        {label}
      </div>
      {sparkData && <MiniSparkline data={sparkData} color={sparkColor || '#6366f1'} />}
     </div>
     <div>
       <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2 tracking-tight font-heading">{prefix}{value}</h3>
       <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${trendUp ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800'}`}>
        {trendUp ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
        {trend}
      </div>
    </div>
  </div>
);

/* ============================================================
   CIRCULAR PROGRESS
   ============================================================ */

export const CircularProgress = ({ value, size = 80, strokeWidth = 6, color = '#6366f1', label, sublabel }: {
  value: number; size?: number; strokeWidth?: number; color?: string; label: string; sublabel: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const textSize = size >= 80 ? 'text-lg' : size >= 60 ? 'text-base' : 'text-sm';
  const labelSize = size >= 80 ? 'text-sm' : 'text-xs';
  const sublabelSize = size >= 80 ? 'text-xs' : 'text-[10px]';
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#f1f5f9" strokeWidth={strokeWidth} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round"
             strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
         </svg>
         <div className="absolute inset-0 flex items-center justify-center">
           <span className={`${textSize} font-extrabold text-slate-800 dark:text-white font-heading tabular-nums`}>{value}%</span>
         </div>
       </div>
       <div className="text-center">
         <p className={`${labelSize} font-semibold text-slate-700 dark:text-slate-300 font-heading`}>{label}</p>
         <p className={`${sublabelSize} text-slate-400`}>{sublabel}</p>
       </div>
    </div>
  );
};

/* ============================================================
   STUDY HEATMAP (Profile)
   ============================================================ */
import { StudySessionRow } from '../lib/api';

export const StudyHeatmap = ({ sessions = [] }: { sessions?: StudySessionRow[] }) => {
  const weeks = 20;
  const days = 7;
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  
  // Calculate today
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Set to end of day to include all today's sessions

  // Group durations by relative day offset (0 = today, 1 = yesterday, etc.)
  const sessionData = new Map<number, number>(); // <daysAgo, totalDurationSec>
  sessions.forEach(session => {
    const sessionDate = new Date(session.started_at);
    const diffTime = today.getTime() - sessionDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Only care about last 20 weeks (140 days)
    if (diffDays >= 0 && diffDays < (weeks * days)) {
      const prev = sessionData.get(diffDays) || 0;
      sessionData.set(diffDays, prev + session.duration_sec);
    }
  });

  const getIntensity = (durationSec: number): number => {
    const minutes = durationSec / 60;
    if (minutes === 0) return 0;
    if (minutes < 30) return 1;
    if (minutes < 60) return 2;
    if (minutes < 120) return 3;
    return 4;
  };
  const intensityColors = ['bg-slate-100 dark:bg-slate-800', 'bg-emerald-200 dark:bg-emerald-800/60', 'bg-emerald-300 dark:bg-emerald-600/70', 'bg-emerald-500 dark:bg-emerald-500', 'bg-emerald-700 dark:bg-emerald-400'];
  return (
    <div className="w-full">
      <div className="flex gap-1">
        <div className="hidden sm:flex flex-col gap-1 mr-1 pt-0">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-3 sm:h-3 flex items-center">
              <span className="text-[10px] text-slate-400 w-6 font-mono hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-1 flex-1 overflow-hidden">
          {Array.from({ length: weeks }).map((_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {Array.from({ length: days }).map((_, dayIdx) => {
                // Calculate which day this cell corresponds to
                // weekIdx 19 is current week. dayIdx 6 is Saturday.
                // Assuming today is what day of the week? 
                const currentDayOfWeek = new Date().getDay(); // 0 (Sun) to 6 (Sat)
                 
                // Let's figure out how many days ago this cell was
                // Current week (weekIdx = 19). The last cell should be currentDayOfWeek.
                // So if we are in weekIdx W and dayIdx D, 
                // Weeks ago = (weeks - 1) - weekIdx
                const weeksAgo = (weeks - 1) - weekIdx;
                 
                // Diff relative to today's day of the week:
                // Current week: If D > currentDayOfWeek, it's in the future (empty or ignore)
                // To keep grid aligned to Sunday-Saturday:
                // daysAgo = (weeksAgo * 7) + (currentDayOfWeek - dayIdx)
                const daysAgo = (weeksAgo * 7) + (currentDayOfWeek - dayIdx);
                 
                let intensity = 0;
                let durationSec = 0;
                let isFuture = false;

                if (daysAgo < 0) {
                    isFuture = true;
                } else {
                    durationSec = sessionData.get(daysAgo) || 0;
                    intensity = getIntensity(durationSec);
                }

                return (
                  <div key={dayIdx} className={`w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-sm ${isFuture ? 'bg-transparent' : intensityColors[intensity]} transition-colors hover:ring-1 hover:ring-slate-400 cursor-pointer`}
                    title={isFuture ? '' : `${Math.round(durationSec / 60)} min studied`} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1 mt-3">
        <span className="text-[10px] text-slate-400 mr-1 hidden sm:inline">Less</span>
        {intensityColors.map((color, i) => (<div key={i} className={`w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-sm ${color}`} />))}
        <span className="text-[10px] text-slate-400 ml-1 hidden sm:inline">More</span>
      </div>
    </div>
  );
};

/* ============================================================
   ANALYTICS CHARTS
   ============================================================ */

export const StudyTimeHeatmap = () => {
  const hours = ['6am', '9am', '12pm', '3pm', '6pm', '9pm'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = [
    [0.1, 0.3, 0.8, 0.6, 0.2, 0.0],
    [0.2, 0.5, 0.7, 0.9, 0.4, 0.1],
    [0.0, 0.2, 0.6, 0.4, 0.3, 0.0],
    [0.3, 0.7, 0.9, 1.0, 0.5, 0.2],
    [0.1, 0.4, 0.5, 0.7, 0.6, 0.3],
    [0.0, 0.1, 0.2, 0.3, 0.1, 0.0],
    [0.4, 0.6, 0.8, 0.5, 0.2, 0.1],
  ];

  const getColor = (v: number) => {
    if (v === 0) return 'bg-slate-50';
    if (v <= 0.2) return 'bg-indigo-100';
    if (v <= 0.4) return 'bg-indigo-200';
    if (v <= 0.6) return 'bg-indigo-300';
    if (v <= 0.8) return 'bg-indigo-400';
    return 'bg-indigo-500';
  };

  return (
    <div className="w-full">
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 pr-2 pt-6">
          {days.map(d => (
            <div key={d} className="h-7 flex items-center text-[10px] text-slate-400 font-medium">{d}</div>
          ))}
        </div>
        <div className="flex-1">
          <div className="flex gap-1 mb-1">
            {hours.map(h => (
              <div key={h} className="flex-1 text-center text-[10px] text-slate-400 font-medium">{h}</div>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {data.map((row, di) => (
              <div key={di} className="flex gap-1">
                {row.map((val, hi) => (
                  <div
                    key={hi}
                    className={`flex-1 h-7 rounded-md ${getColor(val)} transition-all hover:scale-110 hover:ring-2 hover:ring-indigo-300 cursor-pointer`}
                    title={`${days[di]} ${hours[hi]}: ${Math.round(val * 60)}min`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 justify-end">
        <span className="text-[10px] text-slate-400">Less</span>
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((v, i) => (
          <div key={i} className={`w-4 h-4 rounded ${getColor(v)}`} />
        ))}
        <span className="text-[10px] text-slate-400">More</span>
      </div>
    </div>
  );
};

interface TopicDonutChartProps {
  data?: { name: string; percentage: number; color?: string }[];
}

export const TopicDonutChart = ({ data: propData }: TopicDonutChartProps) => {
  const defaultTopics = [
    { name: 'Cardiology', pct: 28, color: '#6366f1' },
    { name: 'Neurology', pct: 22, color: '#8b5cf6' },
    { name: 'Pulmonology', pct: 18, color: '#a78bfa' },
    { name: 'Renal', pct: 15, color: '#c4b5fd' },
    { name: 'GI', pct: 10, color: '#ddd6fe' },
    { name: 'Other', pct: 7, color: '#ede9fe' },
  ];

  const topics = propData && propData.length > 0
    ? propData.map((d, i) => ({
        name: d.name,
        pct: d.percentage,
        color: d.color || defaultTopics[i % defaultTopics.length].color // Use provided color or default
      }))
    : [];

  if (topics.length === 0) {
    return (
      <div className="w-full h-[220px] flex items-center justify-center text-slate-400 text-sm">
        No topic data available
      </div>
    );
  }

  const size = 180;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {topics.map((topic, i) => {
          const dashLength = (topic.pct / 100) * circumference;
          const gap = circumference - dashLength;
          const offset = cumulativeOffset;
          cumulativeOffset += dashLength;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={topic.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              className="transition-all duration-500 hover:opacity-80"
             />
           );
         })}
         <circle cx={size / 2} cy={size / 2} r={radius - strokeWidth / 2 + 2} fill="white" className="dark:fill-slate-800" />
       </svg>
       <div className="grid grid-cols-3 gap-x-6 gap-y-2 mt-4">
        {topics.map((t, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
            <span className="text-[10px] text-slate-500 font-medium">{t.name} ({t.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ScoreTrendAreaChartProps {
  data?: { activity_date: string; question_count: number; correct_count?: number }[];
}

export const ScoreTrendAreaChart = ({ data: propData }: ScoreTrendAreaChartProps) => {
   const { theme } = useTheme();
   const isDark = theme === 'dark';
   const gridColor = isDark ? '#334155' : '#e2e8f0';
   const textColor = isDark ? '#94a3b8' : '#cbd5e1';
 
   const defaultMonths = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
   const defaultScores = [52, 58, 55, 63, 68, 72, 75, 81];

   let labels = defaultMonths;
   let scores = defaultScores;

   if (propData && propData.length > 0) {
     labels = propData.map(d => d.activity_date);
     scores = propData.map(d => {
       if (d.question_count === 0) return 0;
       return Math.round(((d.correct_count || 0) / d.question_count) * 100);
     });
   }
   
   const w = 600;
   const h = 180;
   const padding = 30;
   const maxScore = 100;
   const minScore = 0; // Changed to 0 to accommodate daily accuracy which can fluctuate more

   const points = scores.map((s, i) => ({
     x: padding + (i / (scores.length - 1)) * (w - padding * 2),
     y: h - padding - ((s - minScore) / (maxScore - minScore)) * (h - padding * 2),
   }));

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${points[points.length - 1].x},${h - padding} L${points[0].x},${h - padding} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[40, 60, 80, 100].map(tick => {
        const y = h - padding - ((tick - minScore) / (maxScore - minScore)) * (h - padding * 2);
        return (
           <g key={tick}>
             <line x1={padding} y1={y} x2={w - padding} y2={y} stroke={gridColor} strokeWidth="1" strokeDasharray="4 4" />
             <text x={padding - 8} y={y + 4} textAnchor="end" className="text-[10px]" fill={textColor}>{tick}%</text>
           </g>
         );
      })}
      <path d={area} fill="url(#areaGrad)" />
      <path d={line} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
         <g key={i}>
           <circle cx={p.x} cy={p.y} r="5" fill={isDark ? "#1e293b" : "white"} stroke="#6366f1" strokeWidth="2.5" className="transition-all hover:r-[7]" />
           <text x={p.x} y={h - 8} textAnchor="middle" className="text-[10px] font-medium" fill={textColor}>{labels[i]}</text>
         </g>
       ))}
    </svg>
  );
};
