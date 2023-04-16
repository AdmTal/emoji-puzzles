/**
 * @file CGRecordVideo.js
 * @author runjiatian
 * @date 2022/3/17
 * @brief CGRecordVideo.js
 * @copyright Copyright (c) 2022, ByteDance Inc, All Rights Reserved
 */

const {BaseNode} = require('./BaseNode');
const Amaz = effect.Amaz;

class CGRecordVideo extends BaseNode {
  constructor() {
    super();
    this._videoRecordFlag = false;
    this._isFirstUpdateFrameCalled = false;
  }

  setNext(index, func) {
    this.nexts[index] = func;
  }

  setInput(index, func) {
    this.inputs[index] = func;
  }

  onUpdate(sys, dt) {
    if (!this._isFirstUpdateFrameCalled) {
      this._isFirstUpdateFrameCalled = true;
      if (this._isOnMobile() === false) {
        this._onRecordingStarted();
      }
    }

    // Stay Case
    if (this.nexts[1] != null && this._videoRecordFlag) {
      this.nexts[1]();
    }

    // Idle Case
    if (this.nexts[3] != null && !this._videoRecordFlag) {
      this.nexts[3]();
    }
  }

  onEvent(sys, event) {
    if (event.type === Amaz.AppEventType.COMPAT_BEF) {
      let eventResult = event.args.get(0);
      if (eventResult === Amaz.BEFEventType.BET_RECORD_VIDEO) {
        let eventResult2 = event.args.get(1);

        // Video Start Event
        if (eventResult2 === Amaz.BEF_RECODE_VEDIO_EVENT_CODE.RECODE_VEDIO_START) {
          this._onRecordingStarted();
        }

        // Video End Event
        else if (eventResult2 === Amaz.BEF_RECODE_VEDIO_EVENT_CODE.RECODE_VEDIO_END) {
          this._onRecordingEnded();
        }
      }
    }
  }

  _onRecordingStarted() {
    // Change video record flag
    this._videoRecordFlag = true;
    if (this.nexts[0] != null) {
      this.nexts[0]();
    }
  }

  _onRecordingEnded() {
    // Change video record flag
    this._videoRecordFlag = false;
    if (this.nexts[2] != null) {
      this.nexts[2]();
    }
  }

  // utility function
  _isOnMobile() {
    return Amaz.Platform.name() !== 'Mac' && Amaz.Platform.name() !== 'Windows' && Amaz.Platform.name() !== 'Linux';
  }
}

exports.CGRecordVideo = CGRecordVideo;
