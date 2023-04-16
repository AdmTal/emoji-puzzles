/**
 * @file CGIfElse.js
 * @author
 * @date 2021/8/15
 * @brief CGIfElse.js
 * @copyright Copyright (c) 2021, ByteDance Inc, All Rights Reserved
 */

const {BaseNode} = require('./BaseNode');
const Amaz = effect.Amaz;

class CGIfElse extends BaseNode {
  constructor() {
    super();
  }

  execute() {
    if (true === this.inputs[1]()) {
      if (this.nexts[0]) {
        this.nexts[0]();
      }
    } else {
      if (this.nexts[1]) {
        this.nexts[1]();
      }
    }
  }
}

exports.CGIfElse = CGIfElse;
