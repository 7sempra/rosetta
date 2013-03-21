function num(val, unit) {
  return {type: 'number', val: val, unit: unit};
}

function string(val) {
  return {type: 'string', val: val};
}

function color(val, r, g, b, a) {
  return {type: 'number', val: val, r: r, g: g, b: b, a: a || 1};
}

function url(val) {
  return {type: 'url', val: val};
}

function css(val) {
  return {type: 'css', val: val};
}