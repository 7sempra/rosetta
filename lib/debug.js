
var Token = require('./Token');

exports.printTokenStream = function(tokens) {
  return ' ' + tokens.map(function(t) {
    var str = Token.typeToStr(t.type) + (t.val != null ? '(' + t.val + ')' : '');
    if (t.type === Token.EOL) {
      str += '\n';
    }
    return str;
  }).join(' ');
};

exports.printAst = function(root) {
  var out = [];
  printNode(root, '', out);
  return out.join('');
};

function printNode(node, padding, out) {
  if (node.type === 'namespace') {
    printNamespace(node, padding, out);
  } else {
    printGenericNode(node, padding, out);
  }
}

var INDENT_STEP = ' ';

function printGenericNode(node, padding, out) {
  out.push(node.type);
  out.push('\n');

  for (var v in node) {
    if (v == 'type') {
      continue;
    }

    out.push(padding);
    out.push(v);
    out.push(': ');

    var val = node[v];
    if (val == null) {
      out.push('null\n');
    } else if (typeof(val.type) === 'string') {
      printNode(node[v], padding + INDENT_STEP, out);
    } else if (typeof(val.type) === 'number') {
      out.push(Token.typeToStr(val.type) + (val.val != null ? '(' + val.val + ')' : '') + '\n');
    } else {
      console.log('Warning: strange node type:', v, '->', node[v]);
    }
  }
}

function printNamespace(node, padding, out) {
  out.push(node.type);


  if (node.name) {
    out.push('\n');
    out.push(padding);
    out.push('name: ');
    printNode(node.name, padding + INDENT_STEP, out);
  } else {
    out.push(' (root)');
    out.push('\n');
  }

  for (var a = 0; a < node.nl.length; a++) {
    out.push(padding);
    out.push(a);
    out.push(': ');
    printNode(node.nl[a], padding + INDENT_STEP, out);
  }
}

/*
function printAssignment(node, padding, out) {
  out.push(node.type);
  out.push('\n');

  out.push(padding);
  out.push('target: $');
  out.push(node.target.val);
  out.push('\n');

  out.push(padding);
  out.push('value: ');
  printNode(node.value, padding + INDENT_STEP);
}

function printBinOp(node, padding, out) {
  out.push(node.type);
  out.push(' ');
  out.push(Token.typeToStr(node.op));
  out.push('\n');

  out.push(padding);
  out.push('left: ');
  printNode(node.left, padding + INDENT_STEP);

  out.push(padding);
  out.push('right: ');
  printNode(node.right, padding + INDENT_STEP);
}

function printUnaryOp(node, padding, out) {
  out.push(node.type);
  out.push(' ');
  out.push(Token.typeToStr(node.op));
  out.push('\n');

  out.push(padding);
  out.push('right: ');
  printNode(node.right, padding + INDENT_STEP);
}

function printAtom(node, padding, out) {

}
*/