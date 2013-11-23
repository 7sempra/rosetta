var fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    classdef = require('classdef');

var errors = require('../errors');

var _templates = {
  'commonjs': __dirname + '/jstemplates/commonjs.txt',
  'requirejs': __dirname + '/jstemplates/requirejs.txt',
  'flat': __dirname + '/jstemplates/flat.txt'
};

function _error(message) {
  throw new errors.RosettaError(message);
}

module.exports.compile = function(root, options) {

  var preamble = fs.readFileSync(
      path.join(__dirname, 'jstemplates', 'preamble.js'), 'utf8');

  var template = options.jsTemplate;
  if (!template) {
    var templatePath = _templates[options.jsFormat] ||
        _error('Unrecognized JS output format: ' + options.jsFormat);
    template = fs.readFileSync(templatePath, 'utf8');
  }

  return _compile(root, options, preamble, template);
};

function _compile(root, options, preamble, templateStr) {
  var formatter = new JsFormatter();

  var blob = ['{\n', _dumpScope(root, 1), '\n}'].join('');

  function _dumpScope(scope, depth) {
    var indent = (new Array(depth + 1).join('  '));

    var entries = [];
    var v;

    for (v in scope.vars) {
      var symdef = scope.vars[v];
      entries.push(indent + formatter.formatVarname(symdef.varname) + ': ' +
          formatter.formatValue(symdef.value));
    }

    for (v in scope.namespaces) {
      var childScope = scope.namespaces[v];
      entries.push(indent + formatter.formatVarname(childScope.name) + ': {\n' +
          _dumpScope(childScope, depth + 1) + '\n' + indent +'}');
    }

    return entries.join(',\n');
  }

  var t = _.template(templateStr);

  return {
    path: options.jsOut,
    text: t({
      preamble: preamble,
      blob: blob
    })
  };
}

var JsFormatter = classdef({

  formatVarname: function(value) {
    var p, pieces = value.split('-');
    for (var a = 1; a < pieces.length; a++) {
      p = pieces[a];
      pieces[a] = p[0].toUpperCase() + p.substr(1);
    }
    return pieces.join('');
  },

  formatValue: function(value) {
    var formatter = JsFormatter._formatters[value.type];
    if (!formatter) {
      throw new errors.RosettaError('Unsupported output type: ' + value.type);
    }
    return formatter(value);
  },

  _writeNumber: function(number) {
    return number.unit ?
      'num(' + number.val + ',\'' + number.unit + '\')' :
      'num(' + number.val + ')';
  },

  _writeColor: function(color) {
    return ['color(', color.val, ',', color.r, ',', color.g, ',', color.b,
        color.a ? ',' + color.a : '', ')'].join('');
  },

  _writeString: function(string) {
    return ['string(', string.wrapChar, string.val, string.wrapChar,
        ')'].join('');
  },

  _writeUrl: function(url) {
    return ['url(', url.wrapChar, url.val, url.wrapChar, ')'].join('');
  },

  _writeIdent: function(ident) {
    return ['css(', '\'', ident.val, '\'', ')'].join('');
  }
});

JsFormatter._formatters = {
  'number': JsFormatter.prototype._writeNumber,
  'color': JsFormatter.prototype._writeColor,
  'string': JsFormatter.prototype._writeString,
  'url': JsFormatter.prototype._writeUrl,
  'ident': JsFormatter.prototype._writeIdent
};