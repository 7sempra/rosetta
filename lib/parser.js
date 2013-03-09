var Token = require('./Token');
var nodes = require('./nodes');
var errors = require('./errors');

exports.parse = function(tokens, options) {
  var p = new Parser(tokens, options);
  return p.parse();
}

function error(token, msg) {
  throw new errors.CompilerError('ParseError', msg, token);
}

function compilerError(msg) {
  throw new errors.RosettaError(msg);
}

var Parser = function(tokens, options) {
  this.tokens = tokens;
  this.a = 0;
  this.t = tokens[this.a];
  this.root = null;
  this.scope = null;
}

Parser.prototype = {
  constructor: Parser,

  parse: function() {
    return this.namespace(true);
  },

  peek: function() {
    return this.t;
  },

  lookahead: function(n) {
    return this.tokens[this.a + n];
  },

  goto: function(a) {
    this.a = a;
    this.t = this.tokens[a];
  },

  next: function() {
    this.a++;
    return this.t = this.tokens[this.a];
  },

  expect: function(type) {
    var t = this.t;
    if (t.type !== type) {
      error(t, 'Unexpected token "' + Token.typeToCharOrDesc(t.type) +
        '". Was expecting "' + Token.typeToCharOrDesc(type) + '"');
    }
    this.next();
    return t;
  },

  accept: function(type) {
    if (this.t.type === type) {
      var t = this.t;
      this.next();
      return t;
    }
    return null;
  },

  namespace: function(isRoot) {
    var ns = nodes.Namespace(this.scope);
    this.scope = ns;

    if (isRoot) {
      ns.indentLen = 0;
      this.root = ns;
    } else {
      ns.name = this.namespaceName();
      this.accept(Token.COMMENT);
      this.expect(Token.EOL);
    }

    var n, t;
    var currentIndent = 0;
    var statementStart = this.a;
    while(this.t) {
      if (t = this.accept(Token.INDENT)) {
        currentIndent = t.val.length;
      } else if (t = this.accept(Token.EOL)) {
        currentIndent = 0;
        statementStart = this.a;
      } else if (t = this.accept(Token.COMMENT)) {
        // ignore
      } else {
        if (ns.parentScope && currentIndent <= ns.parentScope.indentLen) {
          this.goto(statementStart);
          break;
        }

        if (ns.indentLen == null) {
          ns.indentLen = currentIndent;
        } else if (currentIndent !== ns.indentLen) {
          error(t, 'Inconsistent indentation. Expected ' + ns.indentLen +
            ' whitespace chars but found ' + currentIndent + '.');
        }

        if (this.t.type === Token.IDENT) {
          n = this.namespace();
        } else {
          n = this.assignment();
          this.accept(Token.SEMI);
          this.accept(Token.COMMENT);
          this.expect(Token.EOL);
        }
        currentIndent = 0;
        statementStart = this.a;
        ns.nl.push(n);
      }
    }

    this.scope = ns.parentScope;
    return ns;
  },

  assignment: function() {
    var varName = this.expect(Token.VARIABLE);
    this.expect(Token.EQ);
    return nodes.Assignment(varName, this.expression());
  },

  expression: function() {
    var n = this.additive();
    return n;
  },

  additive: function() {
    var n, t;

    n = this.multiplicative();
    while (t = (this.accept(Token.PLUS) || this.accept(Token.MINUS))) {
      n = nodes.BinOp(t, n, this.multiplicative());
    }
    return n;
  },

  multiplicative: function() {
    var n, t;

    n = this.unary();
    while (t = (this.accept(Token.MULT) || this.accept(Token.DIV))) {
      n = nodes.BinOp(t, n, this.unary());
    }
    return n;
  },

  unary: function() {
    var n, t;
    t = this.peek();
    if (t.type === Token.PLUS || t.type === Token.MINUS) {
      this.next();
      n = nodes.UnaryOp(t, this.atom());
    } else {
      n = this.atom();
    }

    return n;
  },

  atom: function() {
    var n, t;

    if (this.accept(Token.LPAREN)) {
      n = this.expression();
      this.expect(Token.RPAREN);
    } else {
      t = this.peek();
      switch(t.type) {
        case Token.STRING_LIT:
        case Token.COLOR_HASH:
        case Token.VARIABLE:
          this.next();
          n = nodes.Atom(t);
          break;
        case Token.NUMBER:
          this.next();
          n = nodes.Number(t, this.accept(Token.IDENT) || this.accept(Token.PERC));
          break;
        case Token.IDENT:
          n = this.ident();
          break;
        default:
          error(t, 'Unexpected token: "' + Token.typeToCharOrDesc(t) + '"');
          break;
      }
    }

    return n;
  },

  ident: function() {
    var n, t, t1;

    t = this.peek();
    if (t.val === 'url') {
      n = this.url();
    } else if (t.val === 'rgb') {
      n = this.rgb();
    } else if (t.val === 'rgba') {
      n = this.rgba();
    } else {
      if ((t1 = this.lookahead(1), t1.type === Token.PERIOD)) {
        n = this.varRef();
      } else {
        this.next();
        n = nodes.Atom(t);
      }
    }

    return n;
  },

  url: function() {
    this.next();
    this.expect(Token.LPAREN);
    var n = nodes.Url(this.expect(Token.STRING_LIT));
    this.expect(Token.RPAREN);

    return n;
  },

  rgb: function() {
    var r, g, b;

    this.next();
    this.expect(Token.LPAREN);
    r = this.expect(Token.NUMBER);
    this.expect(Token.COMMA);
    g = this.expect(Token.NUMBER);
    this.expect(Token.COMMA);
    b = this.expect(Token.NUMBER);
    this.expect(Token.RPAREN);

    return nodes.Rgb(r, g, b);
  },

  rgba: function() {
    var r, g, b, a;

    this.next();
    this.expect(Token.LPAREN);
    r = this.expect(Token.NUMBER);
    this.expect(Token.COMMA);
    g = this.expect(Token.NUMBER);
    this.expect(Token.COMMA);
    b = this.expect(Token.NUMBER);
    this.expect(Token.COMMA);
    a = this.expect(Token.NUMBER);
    this.expect(Token.RPAREN);

    return nodes.Rgba(r, g, b, a);
  },

  varRef: function() {
    var n, t;

    if (t = this.accept(Token.VARIABLE)) {
      n = nodes.Atom(t);
    } else if (t = this.accept(Token.IDENT)) {
      this.expect(Token.PERIOD);
      n = nodes.Property(t, this.varRef());
    } else {
      error(t, 'Unexpected token: "' + Token.typeToCharOrDesc(t) + '"');
    }
    return n;
  },

  namespaceName: function() {
    var n, t;
    t = this.expect(Token.IDENT);
    if (this.accept(Token.PERIOD)) {
      n = nodes.Property(t, this.namespaceName());
    } else {
      n = nodes.Atom(t);
      this.expect(Token.COLON);
    }
    return n;
  }
}