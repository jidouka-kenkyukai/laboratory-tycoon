import { useGameStore } from '../../store/gameStore';
import { EVENT_BY_ID } from '../../domain/data/events';

/**
 * pendingEvent がある時に被せて表示するモーダル。
 * ActionPanel はその間アクションを出さないので、プレイヤーは選ばざるを得ない。
 */
export function EventModal() {
  const pending = useGameStore((g) => g.state.pendingEvent);
  const resolve = useGameStore((g) => g.doResolveEvent);
  if (!pending) return null;
  const def = EVENT_BY_ID.get(pending.defId);
  if (!def) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-lg border border-lab-border bg-lab-panel shadow-2xl">
        <div className="border-b border-lab-border px-4 py-3 flex items-center gap-2">
          <div className="text-3xl">{def.icon}</div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-lab-muted">
              Day {pending.day} のイベント
            </div>
            <div className="text-lg font-semibold">{def.title}</div>
          </div>
        </div>
        <div className="px-4 py-3 text-[14px] leading-relaxed text-lab-text">{def.narration}</div>
        <div className="px-4 py-3 border-t border-lab-border space-y-2">
          {def.choices.map((c) => (
            <button
              key={c.id}
              onClick={() => resolve(c)}
              className="w-full text-left rounded border border-lab-border bg-lab-bg/60 px-3 py-2 hover:border-lab-accent hover:bg-lab-bg"
            >
              <div className="font-semibold text-sm">{c.label}</div>
              {c.description && <div className="text-xs text-lab-muted">{c.description}</div>}
              <div className="flex flex-wrap gap-1 mt-1">
                {c.effects.map((e, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-lab-panel border border-lab-border text-lab-muted"
                  >
                    {formatEffect(e)}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatEffect(e: import('../../domain/types').Effect): string {
  switch (e.kind) {
    case 'rp':
      return `RP ${signed(e.amount)}`;
    case 'funds':
      return `$${signed(e.amount)}`;
    case 'reputation':
      return `評判 ${signed(e.amount)}`;
    case 'mental':
      return `メンタル ${signed(e.amount)}`;
    case 'focus':
      return `集中 ${signed(e.amount)}`;
    case 'timeSlot':
      return `時間 ${signed(e.amount)}`;
    case 'skillXp':
      return `${e.skill} XP+${e.amount}`;
    case 'progressProject':
      return `進捗 ${signed(e.amount)}`;
    case 'addExperimentData':
      return `データ +1`;
  }
}

function signed(n: number) {
  return n >= 0 ? `+${n}` : `${n}`;
}
