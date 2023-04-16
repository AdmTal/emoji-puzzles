const Amaz = effect.Amaz;
const {BaseNode} = require('./BaseNode');

class CGAnimationSequenceController extends BaseNode {
  constructor() {
    super();
    this.component = null;
  }

  beforeStart(sys) {
    this.component = this.inputs[4]();
    if (this.component) {
      sys.eventListener.registerListener(sys.script, Amaz.AnimSeqEventType.ANIMSEQ_END, this.component, sys.script);
      sys.eventListener.registerListener(sys.script, Amaz.AnimSeqEventType.ANIMSEQ_START, this.component, sys.script);
      sys.eventListener.registerListener(
        sys.script,
        Amaz.AnimSeqEventType.ANIMSEQ_WHOLE_START,
        this.component,
        sys.script
      );
      sys.eventListener.registerListener(
        sys.script,
        Amaz.AnimSeqEventType.ANIMSEQ_WHOLE_END,
        this.component,
        sys.script
      );
    }
  }

  onCallBack(userData, info, eventType) {
    let animSeqComp = info.animSeqCom;
    if (animSeqComp === null || animSeqComp === undefined) {
      return;
    }
    let guid = animSeqComp.guid;
    if (this.component.guid.eq(guid)) {
      if (eventType === Amaz.AnimSeqEventType.ANIMSEQ_END) {
        if (this.nexts[3]) {
          this.nexts[3]();
        }
      } else if (eventType === Amaz.AnimSeqEventType.ANIMSEQ_START) {
        if (this.nexts[2]) {
          this.nexts[2]();
        }
      } else if (eventType === Amaz.AnimSeqEventType.ANIMSEQ_WHOLE_START) {
        if (this.nexts[1]) {
          this.nexts[1]();
        }
      } else if (eventType === Amaz.AnimSeqEventType.ANIMSEQ_WHOLE_END) {
        if (this.nexts[4]) {
          this.nexts[4]();
        }
      }
    }
  }

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  execute(index) {
    let from = Math.max(0, Math.round(this.inputs[5]()));
    let to = Math.max(0, Math.round(this.inputs[6]()));
    const loopTimes = Math.max(1, Math.round(this.inputs[7]()));
    const stopOnLast = this.inputs[8]();

    if (this.component) {
      if (this.nexts[0]) {
        this.nexts[0]();
      }
      const frameCount = this.component.animSeq.getFrameCount();
      from = this.clamp(from, 0, frameCount - 1);
      to = this.clamp(to, 0, frameCount - 1);
      if (index === 0) {
        // play
        this.component.resetAnim();
        this.component.playFromTo(from, to, this.component.playmode, loopTimes, stopOnLast);
        this.component.play();
      } else if (index === 1) {
        // stop
        this.component.stop();
        this.component.entity.visible = false;
        this.component.frameIndex = 0;
        if (this.nexts[4]) {
          this.nexts[4]();
        }
      } else if (index === 2) {
        // pause
        this.component.pause();
      } else if (index === 3) {
        // resume
        this.component.play();
      }
    }
  }

  onDestroy(sys) {}

  getOutput(index) {
    if (index === 5) {
      if (this.component) {
        return this.component.frameIndex;
      }
    }
    return 0;
  }
}

exports.CGAnimationSequenceController = CGAnimationSequenceController;
