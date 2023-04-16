/**
 * @file CGWait.js
 * @author liujiacheng
 * @date 2021/8/20
 * @brief CGWait.js
 * @copyright Copyright (c) 2021, ByteDance Inc, All Rights Reserved
 */

const {BaseNode} = require('./BaseNode');
const Amaz = effect.Amaz;

class CGWait extends BaseNode {
  constructor() {
    super();
    this.timeUsed = 0;
    this.enable = false;
  }

  execute(index) {
    this.enable = true;
  }

  onUpdate(sys, dt) {
    if (!this.enable) {
      return;
    }

    this.timeUsed = this.timeUsed + dt;
    if (this.timeUsed < this.inputs[1]()) {
      return;
    }

    if (this.nexts[0]) {
      this.timeUsed = 0;
      this.enable = false;
      this.nexts[0]();
    }
  }
}

exports.CGWait = CGWait;
