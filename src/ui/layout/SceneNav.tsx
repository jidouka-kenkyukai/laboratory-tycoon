import clsx from 'clsx';
import { useGameStore } from '../../store/gameStore';
import { SCENE_META, SCENE_ORDER } from '../presenters/selectors';

/**
 * SceneArea にオーバーレイ表示する縦並びのナビ。
 * 移動 (シーン切替) と「1日終了」を一箇所にまとめる。
 */
export function SceneNav() {
  const current = useGameStore((g) => g.state.scene);
  const setScene = useGameStore((g) => g.setScene);
  const endDay = useGameStore((g) => g.endDay);

  return (
    <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 sm:gap-1.5 z-10">
      {SCENE_ORDER.map((s) => {
        const meta = SCENE_META[s];
        const active = s === current;
        return (
          <button
            key={s}
            onClick={() => setScene(s)}
            title={`移動: ${meta.label}`}
            className={clsx(
              'w-11 h-11 sm:w-14 sm:h-14 rounded-md border flex flex-col items-center justify-center transition shadow-lg',
              active
                ? 'border-lab-accent bg-lab-panel ring-1 ring-lab-accent text-lab-text cursor-default'
                : 'border-lab-border bg-lab-panel/70 hover:border-lab-accent hover:bg-lab-panel text-lab-muted hover:text-lab-text backdrop-blur',
            )}
            disabled={active}
          >
            <span className="text-lg sm:text-xl leading-none">{meta.icon}</span>
            <span className="text-[8px] sm:text-[9px] mt-0.5 leading-none">{meta.label}</span>
          </button>
        );
      })}
      <div className="h-px bg-lab-border my-0.5 sm:my-1" />
      <button
        onClick={endDay}
        title="今日を終える (翌日へ)"
        className="w-11 h-11 sm:w-14 sm:h-14 rounded-md border border-lab-border bg-lab-panel/80 hover:border-lab-good hover:text-lab-good text-lab-warn flex flex-col items-center justify-center transition shadow-lg backdrop-blur"
      >
        <span className="text-lg sm:text-xl leading-none">🌙</span>
        <span className="text-[8px] sm:text-[9px] mt-0.5 leading-none">終了</span>
      </button>
    </div>
  );
}
