import { HUD } from './HUD';
import { SceneArea } from './SceneArea';
import { NarrationArea } from './NarrationArea';
import { ActionPanel } from './ActionPanel';
import { TaskPanel } from './TaskPanel';
import { EventModal } from './EventModal';

/**
 * ソシャゲ風レイアウトの大枠:
 *  ┌─ HUD ───────────────────────┐
 *  ├─ SceneArea ─────────────────┤
 *  │     bg + character          │ ← TaskPanel (進行ボード)
 *  ├─ NarrationArea ─────────────┤   (タブ式の案件管理)
 *  ├─ ActionPanel (tabs) ────────┤
 *  └─────────────────────────────┘
 * SceneArea / ActionPanel / TaskPanel を後で差し替えるだけで見た目が変わる。
 */
export function GameShell() {
  return (
    <div className="h-full w-full flex flex-col bg-lab-bg text-lab-text">
      <HUD />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-col">
          <SceneArea />
          <NarrationArea />
          <ActionPanel />
        </main>
        <TaskPanel />
      </div>
      <EventModal />
    </div>
  );
}
