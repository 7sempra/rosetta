var errors = require('./errors');
var Token = require('./Token');

// poor man's unicode support
var VARIABLE = /\$[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*/g;
var STRING_LITERAL_SINGLE = /'((\\.|[^\n\\'])*)(.)/g;
var STRING_LITERAL_DOUBLE = /"((\\.|[^\n\\"])*)(.)/g;
var NUMBER_START = /[0-9]/g;
var NUMBER = /\d*\.?\d+/g;
var COMMENT = /([^\n]*)(\n|$)/g;
var COLOR_HASH = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/g;
var WHITESPACE = /[^\S\n]+/g;
var IDENT = /[a-zA-Z][a-zA-Z0-9\-]*/g;

var _simpleTokens = {
  '=': Token.EQ,
  '(': Token.LPAREN,
  ')': Token.RPAREN,
  ',': Token.COMMA,
  '%': Token.PERC,
  ':': Token.COLON,
  ';': Token.SEMI,
  '*': Token.MULT,
  '+': Token.PLUS,
  '-': Token.MINUS
};

exports.lex = function(sourceFile) {
  var tokens = [];
  var prevToken = null;

  var a, c, c1, strlen;
  var lineNo = 0;
  var lineStart = 0;
  var lineStarts = [0];

  var m = null;
  var t = null;

  function token(type, val) {
    return {
      type: type,
      pos: a,
      line: lineNo,
      linePos: a - lineStart,
      val: val,
      src: sourceFile
    }
  }

  // TODO: remove all of the 'return's in front of calls to this function
  function error(message) {
    throw new errors.CompileError('LexError', message, token(Token.INVALID));
  }

  var str = sourceFile.text;
  for (a = 0, strlen = str.length; a < strlen; a++) {
    c = str[a];
    t = null;

    //console.log('C:', a, c, c.charCodeAt(0));

    if (_simpleTokens[c] != null) {
      t = token(_simpleTokens[c]);

    } else if (c === '$') {
      VARIABLE.lastIndex = a, m = VARIABLE.exec(str);
      if (!m) {
        return error('Missing variable name');
      }
      t = token(Token.VARIABLE, m[0].substr(1));
      a = VARIABLE.lastIndex - 1;

    } else if (c === '\'') {
      STRING_LITERAL_SINGLE.lastIndex = a, m = STRING_LITERAL_SINGLE.exec(str);
      if (!m || m[3] != '\'' || m.index !== a) {
        return error('Missing closing \'');
      }
      t = token(Token.STRING_LIT, m[1]);
      t.wrapChar = '\'';
      a = STRING_LITERAL_SINGLE.lastIndex - 1;

    } else if (c === '"') {
      STRING_LITERAL_DOUBLE.lastIndex = a, m = STRING_LITERAL_DOUBLE.exec(str);
      if (!m || m[3] !== '"' || m.index !== a) {
        return error('Missing closing "');
      }
      t = token(Token.STRING_LIT, m[1]);
      t.wrapChar = '"';
      a = STRING_LITERAL_DOUBLE.lastIndex - 1;

    } else if (NUMBER_START.test(c)) {
      NUMBER.lastIndex = a, m = NUMBER.exec(str);
      t = token(Token.NUMBER, m[0]);
      a = NUMBER.lastIndex - 1;

    } else if (c === '.') {
      if (NUMBER_START.test(str[a + 1])) {
        NUMBER.lastIndex = a, m = NUMBER.exec(str);
        t = token(Token.NUMBER, m[0]);
        a = NUMBER.lastIndex - 1;
      } else {
        t = token(Token.PERIOD);
      }

    } else if (c === '/') {
      if (str[a + 1] === '/') {
        COMMENT.lastIndex = a + 2, m = COMMENT.exec(str);
        t = token(Token.COMMENT, m[1] || '');
        if (m[2] === '\n') {
          a = COMMENT.lastIndex - 2;
        } else {
          a = COMMENT.lastIndex - 1;
        }

      } else {
        t = token(Token.DIV);
      }

    } else if (c === '#') {
      COLOR_HASH.lastIndex = a, m = COLOR_HASH.exec(str);
      if (!m) {
        return error('Color definitions must be either 3 or 6 hexadecimal characters');
      }
      t = token(Token.COLOR_HASH, m[1]);
      a = COLOR_HASH.lastIndex - 1;

    } else if (WHITESPACE.lastIndex = 0, WHITESPACE.test(c)) {
      WHITESPACE.lastIndex = a;
      m = WHITESPACE.exec(str);
      if (prevToken && prevToken.type === Token.EOL) {
        t = token(Token.INDENT, m[0]);
      }
      a = WHITESPACE.lastIndex - 1;

    } else if (c === '\n') {
      if (prevToken && prevToken.type !== Token.EOL) {
        t = token(Token.EOL);
      }
      lineNo++;
      lineStart = a + 1;
      lineStarts.push(lineStart);

    } else if (IDENT.lastIndex = 0, IDENT.test(c)) {
      IDENT.lastIndex = a, m = IDENT.exec(str);
      t = token(Token.IDENT, m[0]);
      a = IDENT.lastIndex - 1;

    } else {
      return error('Unexpected symbol: ' + c);
    }

    if (t) {
      tokens.push(t);
      prevToken = t;
      //console.log(Token.typeToStr(t.type) + (t.val != null ? '(' + t.val + ')' : ''));
    }
  }

  if (prevToken !== Token.EOL) {
    tokens.push(token(Token.EOL));
  }

  return tokens;
}