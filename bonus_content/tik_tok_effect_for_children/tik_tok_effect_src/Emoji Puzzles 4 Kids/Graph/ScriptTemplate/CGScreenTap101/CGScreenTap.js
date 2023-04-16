/**
 * @file CGMouthOpen.js
 * @author xuyuan
 * @date 2021/8/13
 * @brief CGMouthOpen.js
 * @copyright Copyright (c) 2021, ByteDance Inc, All Rights Reserved
 */

const Amaz = effect.Amaz;
const {BaseNode} = require('./BaseNode');
class CGScreenTap extends BaseNode {
  constructor() {
    super();
  }

  onEvent(sys, event) {
    if (event.type === Amaz.EventType.TOUCH) {
      const touch = event.args.get(0);
      if (touch.type === Amaz.TouchType.TOUCH_BEGAN) {
        this.outputs[1] = new Amaz.Vector2f(touch.x, touch.y);
        if (this.nexts[0]) {
          this.nexts[0]();
        }
      }
    }
  }
}

exports.CGScreenTap = CGScreenTap;
