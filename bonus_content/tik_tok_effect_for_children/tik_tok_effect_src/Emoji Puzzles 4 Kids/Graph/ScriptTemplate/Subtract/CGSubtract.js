/**
 * @file CGSubtract.js
 * @author liujiacheng
 * @date 2021/8/23
 * @brief CGSubtract.js
 * @copyright Copyright (c) 2021, ByteDance Inc, All Rights Reserved
 */

const {BaseNode} = require('./BaseNode');
const Amaz = effect.Amaz;

class CGSubtract extends BaseNode {
  constructor() {
    super();
  }

  setNext(index, func) {
    this.nexts[index] = func;
  }

  setInput(index, func) {
    this.inputs[index] = func;
  }

  getOutput() {
    let v1 = this.inputs[0]();
    let v2 = this.inputs[1]();
    if (v1 !== undefined && v2 !== undefined) {
      if (this.valueType === 'Vector2f') {
        return new Amaz.Vector2f(v1.x - v2.x, v1.y - v2.y);
      } else if (this.valueType === 'Vector3f') {
        return new Amaz.Vector3f(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
      } else if (this.valueType === 'Vector4f') {
        return new Amaz.Vector4f(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z, v1.w - v2.w);
      } else {
        return v1 - v2;
      }
    }
    return undefined;
  }
}

exports.CGSubtract = CGSubtract;
