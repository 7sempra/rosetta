var errors = require('./errors');

exports.formatError = function(e) {
  if (e instanceof errors.CompileError) {
    return _formatCompileError(e);
  } else if (e instanceof errors.RosettaError) {
    return e.message;
  } else {
    return e.toString();
  }
}

exports.formatHeading = function(message, maxLen) {
  maxLen = maxLen || 80;
  message = _ellipsize(message, maxLen);

  return message + '\n' + _getRepeatedChar(message.length, '-') + '\n';
}

function _formatCompileError(e) {
  var msg = '';

  var token = e.token;
  var pos = token.pos;

  msg += e.type + ': ' + e.message;
  msg += '\n\n';

  msg += exports.formatHeading(pos.file.path + ':', 79);

  var linePreamble = pos.line + '| ';
  msg += linePreamble;
  msg += _getLine(pos.line, pos.file.text);
  msg += '\n';

  msg += _getRepeatedChar(linePreamble.length + pos.col);
  msg += '^\n';

  return msg;
}

function _getLine(lineNum, source) {
  var start = 0;

  for (var a = 0; a < lineNum; a++) {
    start = source.indexOf('\n', start) + 1;
    if (start == -1) {
      return '';
    }
  }

  var stop = source.indexOf('\n', start);
  if (stop == -1) {
    stop = source.length;
  }

  return source.substring(start, stop);
}

function _getRepeatedChar(len, char) {
  char = char || ' ';
  return new Array(len + 1).join(char);
}

function _ellipsize(line, maxWidth) {
  if (line.length <= maxWidth) {
    return line;
  } else {
    return '...' + line.substr(3 - maxWidth);
  }
}