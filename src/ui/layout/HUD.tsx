import clsx from 'clsx';
import { useGameStore } from '../../store/gameStore';
import { useUiStore } from '../../store/uiStore';
import { TIER_LABEL } from '../../domain/data/careers';

function Stat({
  icon,
  label,
  value,
  hint,
  toneClass,
  className,
}: {
  icon: string;
  label: string;
  value: string | number;
  hint?: string;
  toneClass?: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'flex items-center gap-1.5 rounded-md bg-lab-panel/80 border border-lab-border px-2 py-1',
        className,
      )}
    >
      <span className="text-base sm:text-lg leading-none">{icon}</span>
      <div className="leading-tight">
        <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-lab-muted">{label}</div>
        <div className={clsx('text-xs sm:text-sm font-semibold', toneClass)}>
          {value}{' '}
          {hint && <span className="text-[10px] sm:text-xs font-normal text-lab-muted">{hint}</span>}
        </div>
      </div>
    </div>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 w-12 sm:w-20 rounded bg-lab-border overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function HUD() {
  const s = useGameStore((g) => g.state);
  const toggleTaskPanel = useUiStore((u) => u.toggleTaskPanel);

  return (
    <header className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 border-b border-lab-border bg-lab-bg/80 backdrop-blur flex-wrap">
      <Stat icon="📅" label="日" value={`Day ${s.day}`} />
      <Stat
        icon="🧑‍🔬"
        label="所属"
        value={s.player.name}
        hint={TIER_LABEL[s.player.tier]}
        className="hidden sm:flex"
      />

      <div className="mx-1 h-8 w-px bg-lab-border hidden sm:block" />

      <Stat icon="⏳" label="時間" value={`${s.daily.timeSlots}/${s.daily.maxTimeSlots}`} />

      <div className="flex items-center gap-1.5 rounded-md bg-lab-panel/80 border border-lab-border px-2 py-1">
        <span className="text-base sm:text-lg leading-none">🧠</span>
        <div className="leading-tight">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-lab-muted">集中</div>
          <Bar value={s.daily.focus} max={100} color="bg-lab-accent" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded-md bg-lab-panel/80 border border-lab-border px-2 py-1">
        <span className="text-base sm:text-lg leading-none">❤️</span>
        <div className="leading-tight">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-lab-muted">メンタル</div>
          <Bar
            value={s.daily.mental}
            max={100}
            color={
              s.daily.mental < 30 ? 'bg-lab-bad' : s.daily.mental < 60 ? 'bg-lab-warn' : 'bg-lab-good'
            }
          />
        </div>
      </div>

      <div className="mx-1 h-8 w-px bg-lab-border hidden sm:block" />

      <Stat icon="💰" label="資金" value={`$${s.resources.funds.toLocaleString()}`} />
      <Stat icon="🔬" label="RP" value={s.resources.researchPoints} toneClass="text-lab-accent" />
      <Stat icon="⭐" label="評判" value={s.resources.reputation} className="hidden sm:flex" />
      <Stat
        icon="📑"
        label="論文"
        value={s.resources.publications}
        hint={`h=${s.resources.hIndex}`}
        className="hidden sm:flex"
      />

      {/* モバイル用: TaskPanel (進行ボード) を開くボタン */}
      <button
        onClick={toggleTaskPanel}
        className="md:hidden ml-auto px-3 py-1.5 rounded-md border border-lab-border bg-lab-panel hover:border-lab-accent text-sm font-semibold flex items-center gap-1"
        title="進行ボードを開く"
      >
        <span>📋</span>
        <span className="text-xs">進行</span>
      </button>
    </header>
  );
}
