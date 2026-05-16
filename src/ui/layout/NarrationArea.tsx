import { useGameStore } from '../../store/gameStore';

/** ソシャゲ風のセリフ枠。Phase 1 はナレーション+直近ログ。 */
export function NarrationArea() {
  const narration = useGameStore((g) => g.state.narration);
  const log = useGameStore((g) => g.state.log);
  const recent = log.slice(0, 3);

  return (
    <section className="border-t border-lab-border bg-lab-panel/90 px-4 py-3">
      <div className="text-[15px] leading-relaxed text-lab-text">{narration}</div>
      {recent.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {recent.map((e) => (
            <li
              key={e.id}
              className={`text-xs ${
                e.kind === 'good'
                  ? 'text-lab-good'
                  : e.kind === 'warn'
                  ? 'text-lab-warn'
                  : e.kind === 'bad'
                  ? 'text-lab-bad'
                  : 'text-lab-muted'
              }`}
            >
              <span className="text-lab-muted">[D{e.day}]</span> {e.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
