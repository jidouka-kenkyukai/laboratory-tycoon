import { useGameStore } from '../../store/gameStore';
import { SCENE_META, selectPresentCharacters } from '../presenters/selectors';
import { SceneNav } from './SceneNav';

/**
 * 中央の「シーンエリア」。
 * Phase 1 はテキスト+アイコンのプレースホルダ。
 * 将来: 背景画像 + キャラ立ち絵に差し替え。
 */
export function SceneArea() {
  const s = useGameStore((g) => g.state);
  const meta = SCENE_META[s.scene];
  const chars = selectPresentCharacters(s);

  return (
    <section
      className={`relative flex-1 min-h-[200px] bg-gradient-to-b ${meta.bgClass} border-y border-lab-border overflow-hidden`}
    >
      <div className="absolute top-3 left-4 text-xs text-lab-muted">
        現在地: <span className="text-lab-text font-semibold">{meta.label}</span>
      </div>
      <div className="absolute top-3 right-4 text-xs text-lab-muted">
        場面ID: <code>{s.scene}</code>
      </div>

      <div className="absolute inset-0 flex items-end justify-center">
        <div className="mb-8 flex gap-10">
          {chars.map((c) => {
            const isPlayer = c === 'player';
            const isStudent = c.startsWith('stu:');
            let icon = '👤';
            let label = c;
            if (isPlayer) {
              icon = '🧑‍🔬';
              label = s.player.name;
            } else if (isStudent) {
              const id = c.slice(4);
              const stu = s.students.find((st) => st.id === id);
              icon = stu?.rank === 'postdoc' ? '👩‍🔬' : '🧑‍🎓';
              label = stu?.name ?? '学生';
            }
            return (
              <div key={c} className="flex flex-col items-center">
                <div className="text-7xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">{icon}</div>
                <div className="mt-1 text-xs text-lab-muted">{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute top-12 left-1/2 -translate-x-1/2 text-5xl opacity-20">{meta.icon}</div>

      <SceneNav />
    </section>
  );
}
