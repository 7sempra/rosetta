var classdef = require('classdef');

var errors = require('./errors');
var Token = require('./Token');

var Resolver = module.exports = classdef({
  constructor: function() {
    this._rootNs = new Scope('root', null, []);
  },

  printScopeTree: function() {
    _printScopeTree(this._rootNs, 0);
  },

  addAst: function(ast) {
    this._fillScope(this._rootNs, ast, 0);
  },

  resolve: function() {
    this._resolveScope(this._rootNs);
    return this._rootNs;
  },

  _fillScope: function(scope, nsNode, depth) {
    var prefix = new Array(depth + 1).join(' ');

    for (var a = 0; a < nsNode.nl.length; a++) {
      var node = nsNode.nl[a];
      if (node.type === 'namespace') {
        var ns = resolveNamespace(scope, node.name);
        this._fillScope(ns, node, depth + 1);

      } else if (node.type === 'assign') {
        var varname = node.target.val;
        if (scope.vars[varname]) {
          var otherDef = scope.vars[varname];
          error(node.target, 'Variable "$' + varname + '" already defined' +
            ' on line ' + otherDef.node.target.line +
            ' of ' + otherDef.node.target.src.path);
        }

        var symdef = new SymbolDefinition(varname, node, scope);
        scope.vars[varname] = symdef;

      } else {
        console.log('WTF');
      }
    }
  },

  _resolveScope: function(scope) {
    //console.log('Resolving scope', scope.name);
    for (var vname in scope.vars) {
      var symdef = scope.vars[vname];

      if (!symdef.value) {
        //console.log('Resolving', '$' + symdef.varname);
        symdef.resolving = true;
        symdef.value = this._resolveExpression(scope, symdef.node.value);
        symdef.resolving = false;
      }
      //console.log(getNamespacePath(symdef.scope) + '.$' + symdef.varname, '->',
      //  symdef.value.val, symdef.value.unit, symdef.value.type);
    }

    for (var nsname in scope.namespaces) {
      this._resolveScope(scope.namespaces[nsname]);
    }
  },

  _resolveExpression: function(scope, node) {
    switch (node.type) {
      case 'atom':
        switch(node.token.type) {
          case Token.STRING_LIT:
            return new StringValue(node.token.val, node.token.wrapChar);
          case Token.COLOR_HASH:
            return _parseColorHash(node.token.val);
          case Token.IDENT:
            return new SymbolValue('ident', node.token.val);
          case Token.VARIABLE:
            return this._computeVarValue(scope, node);
          default:
            compilerError();
        }
        break;
      case 'binop':
        return computeBinOp(node.op,
                            this._resolveExpression(scope, node.left),
                            this._resolveExpression(scope, node.right));
      case 'unop':
        return computeUnOp(node.op, this._resolveExpression(scope, node.right));
      case 'number':
        return new NumberValue(parseFloat(node.value.val), node.unit &&
            node.unit.val);
      case 'url':
        return new UrlValue(node.url.val, node.url.wrapChar);
      case 'rgb':
      case 'rgba':
        return _parseColorExpr(node);
      case 'property':
        return this._computeVarValue(scope, node);
      default:
        compilerError();
    }
  },

  _computeVarValue: function(scope, refNode) {
    var refDef;
    var token;

    if (refNode.type === 'property') {
      token = refNode.left;
      refDef = this._resolveAbsolutePath(refNode);
      if (!refDef) {
        error(refNode.left.token, 'Cannot find variable definition for ' +
            pathToStr(refNode));
      }
    } else if (refNode.type === 'atom') {
      token = refNode.token;
      refDef = this._resolveVarname(scope, token.val);
      if (!refDef) {
        error(refNode.token, 'Cannot find variable definition for "$' +
            token.val + '"');
      }
    } else {
      compilerError();
    }

    if (refDef.value == null) {
      if (refDef.resolving) {
        error(refNode.token, 'Circular definition.');
      }

      refDef.resolving = true;  // TODO: make this refernces to the depending symboldef
      refDef.value = this._resolveExpression(refDef.scope, refDef.node.value);
      refDef.resolving = false;
    }

    return refDef.value;
  },

  _resolveAbsolutePath: function(propNode) {
    var ns = this._rootNs;
    var n = propNode;
    while (n) {
      if (n.type === 'property') {
        ns = ns.namespaces[n.left.val];
        if (!ns) {
          error(n.left, 'No namespace with that name found.');
        }
        n = n.right;
      } else if (n.type ==='atom' && n.token.type === Token.VARIABLE) {
        return ns.vars[n.token.val];
      } else {
        compilerError();
      }
    }
  },

  _resolveVarname: function(scope, varname) {
    while (scope) {
      if (scope.vars[varname]) {
        return scope.vars[varname]
      }
      scope = scope.parent;
    }
    return null;
  }
});


function error(token, message) {
  throw new errors.CompileError('CompileError', message, token);
}

function compilerError(message) {
  throw new errors.RosettaError(message);
}

function resolveNamespace(rootNs, name) {
  var path = [];
  var t = name;
  while (t) {
    if (t.type === 'property') {
      path.push(t.left.val);
      t = t.right;
    } else if (t.type === 'atom') {
      path.push(t.token.val);
      t = null;
    } else {
      compilerError();
    }
  }

  var ns = rootNs;
  for (var a = 0; a < path.length; a++) {
    var nsName = path[a];
    if (!ns.namespaces[nsName]) {
      ns.namespaces[nsName] = new Scope(
        nsName,
        ns,
        path.slice(0, a + 1)
      );
    }
    ns = ns.namespaces[nsName];
  }

  return ns;
}

function getNamespacePath(ns) {
  var path = [ns.name];
  while(ns = ns.parent) {
    path.push(ns.name);
  }
  return path.reverse().join('.');
}

function _printScopeTree(scope, depth) {
  var prefix = new Array(depth + 1).join(' |');
  for (var v in scope.vars) {
    console.log(prefix, '|-', v);
  }
  for (var nsv in scope.namespaces) {
    var ns = scope.namespaces[nsv];
    console.log(prefix, ns.name + ':');
    _printScopeTree(ns, depth + 1);
  }
}

function pathToStr(propNode) {
  var pieces = [];
  while (true) {
    pieces.push(propNode.left.val);
    if (propNode.right.type === 'atom') {
      pieces.push('$' + propNode.right.token.val);
      break;
    } else if (propNode.right.type !== 'property') {
      compilerError();
    }
    propNode = propNode.right;
  }

  return pieces.join('.');
}

function computeBinOp(op, left, right) {
  if (left.unit && right.unit && left.unit !== right.unit) {
    error(op, 'Unit don\'t match. Left side is "' + left.unit +
      '" but right side is "' + right.unit + '".');
  }

  if (op.type !== Token.PLUS && (left.type !== 'number' || right.type !== 'number')) {
    error(op, 'This operation is only valid between two numbers.');
  }

  var val, unit, type;

  switch (op.type) {
    case Token.PLUS:
      val = left.val + right.val;
      break;
    case Token.MINUS:
      val = left.val - right.val;
      break;
    case Token.MULT:
      val = left.val * right.val;
      break;
    case Token.DIV:
      val = left.val / right.val;   // TODO: DETECT DIV-BY-ZERO
      break;
  }
  unit = left.unit || right.unit;
  type = left.type === 'number' && right.type === 'number' ? 'number' :
      'string';

  return new SymbolValue(type, val, unit);
}

function computeUnOp(op, right) {
  if (right.type !== 'number') {
    error(op, 'This operator only valid for numbers.');
  }

  var val;
  switch(op.type) {
    case Token.PLUS:
      val = right.val;
      break;
    case Token.MINUS:
      val = -right.val;
      break;
    default:
      compilerError();
  }

  return new NumberValue(val, right.unit);
}

function _parseColorHash(hash) {
  var val = parseInt(hash, 16);
  return new ColorValue(
    val,
    (val & 0xFF0000) >> 16,
    (val & 0x00FF00) >> 8,
    val & 0x0000FF,
    null
  );
}

function _parseColorExpr(expr) {
  var r = _parseColorCell(expr.r);
  var g = _parseColorCell(expr.g);
  var b = _parseColorCell(expr.b);
  var a = null;
  if (expr.a) {
    a = parseFloat(expr.a.val);
    if (a < 0 || a > 1) {
      error(expr.a, 'Alpha must be a value between 0 and 1');
    }
  }

  return new ColorValue((r << 16) + (g << 8) + b, r, g, b, a);
}

function _parseColorCell(token) {
  var val = parseInt(token.val, 10);
  if (token.val.indexOf('.') != -1 || val < 0 || val > 255) {
    error(token, 'Must be an integer between 0 and 255');
  }
  return val;
}

function Scope(name, parent, path) {
  this.name = name;
  this.parent = parent;
  this.path = path;
  this.vars = {};
  this.namespaces = {};
}

function SymbolDefinition(varname, node, scope) {
  this.varname = varname;
  this.node = node;
  this.scope = scope;
  this.value = null;
  this.resolving = false;
}

function SymbolValue(type, value, unit) {
  this.type = type;
  this.val = value;
}

var NumberValue = classdef({
  constructor: function(val, unit) {
    SymbolValue.call(this, 'number', val);
    this.unit = unit;
  }
});

var ColorValue = classdef(SymbolValue, {
  constructor: function(val, r, g, b, a) {
    SymbolValue.call(this, 'color', val);
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
});

var StringValue = classdef(SymbolValue, {
  constructor: function(val, wrapChar) {
    SymbolValue.call(this, 'string', val);
    this.wrapChar = wrapChar;
  }
});

var UrlValue = classdef(SymbolValue, {
  constructor: function(val, wrapChar) {
    SymbolValue.call(this, 'url', val);
    this.wrapChar = wrapChar;
  }
});