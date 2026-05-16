import { useState } from 'react';
import clsx from 'clsx';
import { useGameStore } from '../../store/gameStore';
import {
  selectActionGroups,
  type AnyAction,
  type ActionGroupId,
} from '../presenters/selectors';
import { useActionDispatch } from '../hooks/useActionDispatch';

function ActionButton({ a, onClick }: { a: AnyAction; onClick: () => void }) {
  const disabled = !!a.disabledReason;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'group text-left rounded-md border px-3 py-2 transition overflow-hidden',
        'flex flex-col gap-1 h-[88px]',
        disabled
          ? 'bg-lab-panel/40 border-lab-border text-lab-muted cursor-not-allowed'
          : 'bg-lab-panel border-lab-border hover:border-lab-accent hover:bg-lab-panel/80 active:translate-y-px',
      )}
      title={a.description}
    >
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-lg leading-none shrink-0">{a.icon}</span>
        <span className="font-semibold text-sm truncate">{a.label}</span>
      </div>
      <div className="text-[11px] text-lab-muted truncate">{a.description}</div>
      {disabled ? (
        <div className="text-[10px] text-lab-bad mt-auto truncate">⛔ {a.disabledReason}</div>
      ) : (
        a.effectPreview && (
          <div className="flex flex-wrap gap-1 mt-auto overflow-hidden max-h-5">
            {a.effectPreview.slice(0, 4).map((p, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded bg-lab-bg/60 border border-lab-border text-lab-muted group-hover:text-lab-text whitespace-nowrap"
              >
                {p}
              </span>
            ))}
          </div>
        )
      )}
    </button>
  );
}

export function ActionPanel() {
  const state = useGameStore((g) => g.state);
  const groups = selectActionGroups(state);
  const dispatch = useActionDispatch();
  const [activeTab, setActiveTab] = useState<ActionGroupId | null>(null);

  // 高さは常に固定 (モバイルは少し低め)
  const PANEL_CLASS = 'h-60 sm:h-72 border-t border-lab-border bg-lab-bg/80 flex flex-col shrink-0';

  if (groups.length === 0) {
    return (
      <section className={clsx(PANEL_CLASS, 'items-center justify-center')}>
        <div className="text-xs text-lab-muted">
          {state.pendingEvent
            ? 'イベントの選択肢を選んでください'
            : 'このシーンで取れるアクションはありません'}
        </div>
      </section>
    );
  }

  const currentId =
    activeTab && groups.find((g) => g.id === activeTab) ? activeTab : groups[0].id;
  const current = groups.find((g) => g.id === currentId)!;

  return (
    <section className={PANEL_CLASS}>
      <div className="flex border-b border-lab-border bg-lab-bg/60 overflow-x-auto shrink-0">
        {groups.map((g) => {
          const active = g.id === currentId;
          return (
            <button
              key={g.id}
              onClick={() => setActiveTab(g.id)}
              className={clsx(
                'px-3 py-2 text-xs whitespace-nowrap border-r border-lab-border transition',
                active
                  ? 'text-lab-accent border-b-2 border-b-lab-accent bg-lab-panel font-semibold'
                  : 'text-lab-muted hover:text-lab-text hover:bg-lab-panel/50',
              )}
            >
              <span className="mr-1">{g.icon}</span>
              {g.label}
              <span className="ml-1 text-[10px] opacity-60">({g.actions.length})</span>
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {current.actions.map((a) => (
            <ActionButton key={a.id} a={a} onClick={() => dispatch(a)} />
          ))}
        </div>
      </div>
    </section>
  );
}
