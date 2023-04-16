/**
 * @file CGTimer.js
 * @author liujiacheng
 * @date 2021/8/20
 * @brief CGTimer.js
 * @copyright Copyright (c) 2021, ByteDance Inc, All Rights Reserved
 */

const {BaseNode} = require('./BaseNode');
const Amaz = effect.Amaz;

class CGTimer extends BaseNode {
  constructor() {
    super();
    this.beginTime = 0;
    this.state = '';
    this.duration = null;
  }

  setNext(index, func) {
    this.nexts[index] = func;
  }

  setInput(index, func) {
    this.inputs[index] = func;
  }

  execute(index) {
    if (index === 0) {
      this.state = 'start';
      this.beginTime = 0;
      this.duration = this.inputs[3]();
      this.outputs[3] = 0;
      this.outputs[4] = 0;
      this.outputs[5] = this.duration;
      if (this.nexts[0]) {
        this.nexts[0]();
      }
    } else if (index === 1) {
      this.state = 'pause';
    } else if (index === 2) {
      this.state = 'start';
    }
  }

  onUpdate(sys, dt) {
    if (this.state !== 'start') {
      return;
    }

    this.beginTime = this.beginTime + dt;
    if (this.beginTime < this.duration) {
      this.outputs[3] = this.beginTime;
      this.outputs[4] = this.beginTime / this.duration;
      this.outputs[5] = this.duration - this.beginTime;
      if (this.nexts[1]) {
        this.nexts[1]();
      }
    }

    if (this.beginTime >= this.duration) {
      this.outputs[3] = this.duration;
      this.outputs[4] = 1;
      this.outputs[5] = 0;
      this.state = 'finish';
      if (this.nexts[1]) {
        this.nexts[1]();
      }
      if (this.nexts[2]) {
        this.nexts[2]();
      }
    }
  }
}

exports.CGTimer = CGTimer;
