
module.exports = {
  Namespace: function(parentScope, indentLen) {
    //console.log('+namespace');
    return {
      type: 'namespace',
      parentScope: parentScope,
      indentLen: null,
      name: null,
      nl: []
    };
  },

  Assignment: function(target, value) {
    //console.log('+assignment', target.val);
    return {
      type: 'assign',
      target: target,
      value: value
    };
  },

  BinOp: function(op, left, right) {
    //console.log('+binOp');
    return {
      type: 'binop',
      op: op,
      left: left,
      right: right
    };
  },

  UnaryOp: function(op, right) {
    //console.log('+unaryOp');
    return {
      type: 'unop',
      op: op,
      right: right
    };
  },

  Atom: function(token) {
    //console.log('+atom', token.type, token.val);
    return {
      type: 'atom',
      token: token
    };
  },

  Number: function(value, unit) {
    //console.log('+number', value.val, unit ? unit.val : null);
    return {
      type: 'number',
      value: value,
      unit: unit
    };
  },

  Url: function(val) {
    return {
      type: 'url',
      url: val
    };
  },

  Rgb: function(r, g, b) {
    return {
      type: 'rgb',
      r: r,
      g: g,
      b: b
    };
  },

  Rgba: function(r, g, b, a) {
    return {
      type: 'rgba',
      r: r,
      g: g,
      b: b,
      a: a
    };
  },

  Property: function(left, right) {
    //console.log('+property');
    return {
      type: 'property',
      left: left,
      right: right
    };
  }
}