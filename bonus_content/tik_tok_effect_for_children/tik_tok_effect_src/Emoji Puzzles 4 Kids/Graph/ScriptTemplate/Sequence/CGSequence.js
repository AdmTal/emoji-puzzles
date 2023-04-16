/**
 * @file CGSequence.js
 * @author liujiacheng
 * @date 2021/8/23
 * @brief CGSequence.js
 * @copyright Copyright (c) 2021, ByteDance Inc, All Rights Reserved
 */

const {BaseNode} = require('./BaseNode');
const Amaz = effect.Amaz;

class CGSequence extends BaseNode {
  constructor() {
    super();
  }

  execute(index) {
    for (let k in this.nexts) {
      if (this.nexts[k]) {
        this.nexts[k]();
      }
    }
  }
}

exports.CGSequence = CGSequence;
