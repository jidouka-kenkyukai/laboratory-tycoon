import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  GameState,
  ProtocolDef,
  Project,
  Paper,
  JournalDef,
  EquipmentDef,
  EquipmentInstance,
  SceneId,
  GrantDef,
  GrantApplication,
  Student,
  EventChoice,
  ConferenceDef,
  ConferenceTalkKind,
  CollaboratorDef,
} from '../domain/types';
import type { StudentTemplate } from '../domain/data/students';
import { createInitialState, SAVE_VERSION } from '../domain/engine/createState';
import { advanceTurn } from '../domain/engine/advanceTurn';
import { setNarration } from '../domain/engine/effects';
import { runExperiment } from '../domain/actions/runExperiment';
import { writePaperDraft } from '../domain/actions/writePaper';
import { submitPaper } from '../domain/actions/submitPaper';
import { reviseResponse, resubmitPaper } from '../domain/actions/revisePaper';
import { takeBreak } from '../domain/actions/rest';
import { buyEquipment } from '../domain/actions/buyEquipment';
import { startNewProject } from '../domain/actions/projects';
import { startGrantApplication, progressGrantWriting, submitGrant } from '../domain/actions/grants';
import { hireStudent, menterStudent } from '../domain/actions/students';
import { resolvePendingEvent } from '../domain/actions/events';
import { registerConference } from '../domain/actions/conferences';
import { promote, evaluatePromotion } from '../domain/actions/careers';
import { createSOP, toggleSOP, deleteSOP } from '../domain/actions/sops';
import { repairEquipment } from '../domain/actions/repair';
import { startCollaboration } from '../domain/actions/collaborations';
import { migrate } from './migrations';

type GameStore = {
  state: GameState;
  setScene: (scene: SceneId) => void;
  doExperiment: (protocol: ProtocolDef) => void;
  doWritePaper: (project: Project) => void;
  doSubmitPaper: (paper: Paper, journal: JournalDef) => void;
  doReviseResponse: (paper: Paper) => void;
  doResubmit: (paper: Paper) => void;
  doRest: () => void;
  doBuyEquipment: (def: EquipmentDef) => void;
  doStartProject: () => void;
  doStartGrant: (def: GrantDef) => void;
  doWriteGrant: (app: GrantApplication) => void;
  doSubmitGrant: (app: GrantApplication) => void;
  doHireStudent: (tpl: StudentTemplate) => void;
  doMentorStudent: (student: Student) => void;
  doResolveEvent: (choice: EventChoice) => void;
  doRegisterConference: (def: ConferenceDef, talkKind: ConferenceTalkKind, project?: Project) => void;
  doPromote: () => void;
  doCreateSOP: (inst: EquipmentInstance, protocol: ProtocolDef) => void;
  doToggleSOP: (sopId: string) => void;
  doDeleteSOP: (sopId: string) => void;
  doRepairEquipment: (inst: EquipmentInstance) => void;
  doStartCollaboration: (def: CollaboratorDef) => void;
  endDay: () => void;
  resetGame: (name?: string) => void;
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      state: createInitialState(),

      setScene: (scene) => {
        set((s) => ({ state: { ...s.state, scene } }));
      },

      doExperiment: (protocol) => {
        const { state } = get();
        if (state.daily.timeSlots < protocol.timeSlots) {
          set((s) => ({ state: setNarration(s.state, '時間がもう残っていない。今日は無理だ。') }));
          return;
        }
        if (state.resources.funds < protocol.costFunds) {
          set((s) => ({ state: setNarration(s.state, '試薬代が足りない。グラントを取らないと。') }));
          return;
        }
        const { state: next } = runExperiment(state, protocol);
        set({ state: next });
      },

      doWritePaper: (project) => {
        const { state } = get();
        if (state.daily.timeSlots < 1) {
          set((s) => ({ state: setNarration(s.state, '時間が無い。執筆は明日に回そう。') }));
          return;
        }
        set({ state: writePaperDraft(state, project) });
      },

      doSubmitPaper: (paper, journal) => {
        const { state } = get();
        if (state.daily.timeSlots < 1) {
          set((s) => ({ state: setNarration(s.state, '投稿準備の時間も無い。') }));
          return;
        }
        set({ state: submitPaper(state, paper, journal) });
      },

      doReviseResponse: (paper) => {
        const { state } = get();
        if (state.daily.timeSlots < 1) return;
        set({ state: reviseResponse(state, paper) });
      },

      doResubmit: (paper) => {
        const { state } = get();
        if (state.daily.timeSlots < 1) return;
        set({ state: resubmitPaper(state, paper) });
      },

      doRest: () => {
        const { state } = get();
        if (state.daily.timeSlots < 1) {
          set((s) => ({ state: setNarration(s.state, '休む時間も惜しい。寝るしかない。') }));
          return;
        }
        set({ state: takeBreak(state) });
      },

      doBuyEquipment: (def) => {
        const { state } = get();
        set({ state: buyEquipment(state, def) });
      },

      doStartProject: () => {
        const { state } = get();
        set({ state: startNewProject(state) });
      },

      doStartGrant: (def) => {
        const { state } = get();
        set({ state: startGrantApplication(state, def) });
      },

      doWriteGrant: (app) => {
        const { state } = get();
        set({ state: progressGrantWriting(state, app) });
      },

      doSubmitGrant: (app) => {
        const { state } = get();
        set({ state: submitGrant(state, app) });
      },

      doHireStudent: (tpl) => {
        const { state } = get();
        set({ state: hireStudent(state, tpl) });
      },

      doMentorStudent: (student) => {
        const { state } = get();
        set({ state: menterStudent(state, student) });
      },

      doResolveEvent: (choice) => {
        const { state } = get();
        set({ state: resolvePendingEvent(state, choice) });
      },

      doRegisterConference: (def, talkKind, project) => {
        const { state } = get();
        set({ state: registerConference(state, def, talkKind, project) });
      },

      doPromote: () => {
        const { state } = get();
        const result = evaluatePromotion(state);
        if (!result.eligible) return;
        set({ state: promote(state) });
      },

      doCreateSOP: (inst, protocol) => {
        const { state } = get();
        set({ state: createSOP(state, inst, protocol) });
      },

      doToggleSOP: (sopId) => {
        const { state } = get();
        set({ state: toggleSOP(state, sopId) });
      },

      doDeleteSOP: (sopId) => {
        const { state } = get();
        set({ state: deleteSOP(state, sopId) });
      },

      doRepairEquipment: (inst) => {
        const { state } = get();
        set({ state: repairEquipment(state, inst) });
      },

      doStartCollaboration: (def) => {
        const { state } = get();
        set({ state: startCollaboration(state, def) });
      },

      endDay: () => {
        set((s) => ({ state: advanceTurn(s.state) }));
      },

      resetGame: (name) => {
        set({ state: createInitialState(name ? { name } : undefined) });
      },
    }),
    {
      name: 'lab-tycoon-save',
      version: SAVE_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, from) => {
        const partial = persistedState as { state?: unknown } | undefined;
        const candidate = partial?.state;
        const migrated = migrate(candidate, from);
        if (!migrated) return { state: createInitialState() } as { state: GameState };
        return { state: migrated } as { state: GameState };
      },
      partialize: (s) => ({ state: s.state }),
    },
  ),
);
