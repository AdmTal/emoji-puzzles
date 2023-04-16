/**
 * @file CGOnStart.js
 * @author
 * @date 2021/8/17
 * @brief CGOnStart.js
 * @copyright Copyright (c) 2021, ByteDance Inc, All Rights Reserved
 */

const {BaseNode} = require('./BaseNode');
const Amaz = effect.Amaz;

class CGOnStart extends BaseNode {
  constructor() {
    super();
  }
  onStart(sys) {
    if (this.nexts[0] !== undefined) {
      this.nexts[0]();
    }
  }
}

exports.CGOnStart = CGOnStart;
