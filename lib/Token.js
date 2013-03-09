
var Token = module.exports = {};

Token.VARIABLE   = 0;
Token.STRING_LIT = 1;
Token.NUMBER     = 2;
Token.COLOR_HASH = 3;
Token.IDENT      = 4;

Token.EQ         = 5;
Token.LPAREN     = 6;
Token.RPAREN     = 7;
Token.COMMA      = 8;
Token.PERC       = 9;
Token.COLON      = 10;
Token.PERIOD     = 11;

Token.PLUS       = 12;
Token.MINUS      = 13;
Token.MULT       = 14;
Token.DIV        = 15;

Token.INDENT     = 16;
Token.EOL        = 17;
Token.EOF        = 18;

Token.COMMENT    = 19;
Token.SEMI       = 20;

Token.INVALID    = 21;

// Node-only types

Token.OPERATOR   = 22;

var _tokenNames = {};
_tokenNames[Token.VARIABLE] = 'VARIABLE';
_tokenNames[Token.STRING_LIT] = 'STRING_LIT';
_tokenNames[Token.NUMBER] = 'NUMBER';
_tokenNames[Token.COLOR_HASH] = 'COLOR_HASH';
_tokenNames[Token.IDENT] = 'IDENT';

_tokenNames[Token.EQ] = 'EQ';
_tokenNames[Token.LPAREN] = 'LPAREN';
_tokenNames[Token.RPAREN] = 'RPAREN';
_tokenNames[Token.COMMA] = 'COMMA';
_tokenNames[Token.PERC] = 'PERC';
_tokenNames[Token.COLON] = 'COLON';
_tokenNames[Token.PERIOD] = 'PERIOD';

_tokenNames[Token.PLUS] = 'PLUS';
_tokenNames[Token.MINUS] = 'MINUS';
_tokenNames[Token.MULT] = 'MULT';
_tokenNames[Token.DIV] = 'DIV';

_tokenNames[Token.INDENT] = 'INDENT';
_tokenNames[Token.EOL] = 'EOL';
_tokenNames[Token.EOF] = 'EOF';

_tokenNames[Token.COMMENT] = 'COMMENT';
_tokenNames[Token.SEMI] = 'SEMI';
_tokenNames[Token.INVALID] = 'INVALID';

Token.typeToStr = function(type) {
  return _tokenNames[type];
}

Token.typeToCharOrDesc = function(type) {
  // TODO: Actually return something nice
  return _tokenNames[type];
}