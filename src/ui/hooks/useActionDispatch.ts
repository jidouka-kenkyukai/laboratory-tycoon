import { useGameStore } from '../../store/gameStore';
import type { AnyAction } from '../presenters/selectors';

/**
 * 全アクションを1関数で dispatch するフック。
 * ActionPanel / TaskPanel など複数の UI から共通で利用する。
 */
export function useActionDispatch() {
  return (a: AnyAction) => {
    const s = useGameStore.getState();
    switch (a.type) {
      case 'experiment':
        s.doExperiment(a.protocol);
        return;
      case 'writePaper':
        s.doWritePaper(a.project);
        return;
      case 'submitPaper':
        s.doSubmitPaper(a.paper, a.journal);
        return;
      case 'revise':
        s.doReviseResponse(a.paper);
        return;
      case 'resubmit':
        s.doResubmit(a.paper);
        return;
      case 'buyEquipment':
        s.doBuyEquipment(a.equipment);
        return;
      case 'startProject':
        s.doStartProject();
        return;
      case 'startGrant':
        s.doStartGrant(a.grant);
        return;
      case 'writeGrant':
        s.doWriteGrant(a.app);
        return;
      case 'submitGrant':
        s.doSubmitGrant(a.app);
        return;
      case 'hireStudent':
        s.doHireStudent(a.template);
        return;
      case 'mentor':
        s.doMentorStudent(a.student);
        return;
      case 'rest':
        s.doRest();
        return;
      case 'changeScene':
        s.setScene(a.scene);
        return;
      case 'endDay':
        s.endDay();
        return;
      case 'registerConference':
        s.doRegisterConference(a.conference, a.talkKind);
        return;
      case 'promote':
        s.doPromote();
        return;
      case 'createSOP':
        s.doCreateSOP(a.equipment, a.protocol);
        return;
      case 'toggleSOP':
        s.doToggleSOP(a.sop.id);
        return;
      case 'deleteSOP':
        s.doDeleteSOP(a.sop.id);
        return;
      case 'repair':
        s.doRepairEquipment(a.equipment);
        return;
      case 'startCollaboration':
        s.doStartCollaboration(a.collaborator);
        return;
    }
  };
}
