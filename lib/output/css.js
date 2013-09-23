var path = require('path'),
    classdef = require('classdef'),
    _ = require('underscore');

var errors = require('../errors');

var _cssExtensions = {
  'stylus': 'styl',
  'sass': 'sass',
  'scss': 'scss',
  'less': 'less'
};

var _cssTemplates = {
  'stylus': '$<%= k %> = <%= v %>',
  'sass': '$<%= k %>: <%= v %>',
  'scss': '$<%= k %>: <%= v %>;',
  'less': '@<%= k %>: <%= v %>;'
};

exports.getFileExtension = function(compilerName) {
  return _cssExtensions[compilerName];
};

exports.compile = function(rootScope, options) {
  var outPath = options.cssOut;
  var splitFiles = outPath.indexOf('{{ns}}') != -1;

  var out = [];
  var adapter = new BasicAdapter(options.cssTemplate ||
      _cssTemplates[options.cssFormat]);

  _dumpScope(rootScope);

  function _dumpScope(scope) {
    var scopeOut = out;
    if (splitFiles) {
      scopeOut = [];
    }

    for (var v in scope.namespaces) {
      _dumpScope(scope.namespaces[v]);
    }

    if (!splitFiles) {
      scopeOut.push('\n');
      scopeOut.push('// ');
      scopeOut.push(scope.parent == null ? 'root' : scope.path.join('.'));
      scopeOut.push('\n');
    }

    for (v in scope.vars) {
      adapter.write(scope.vars[v], scopeOut);
    }

    if (splitFiles) {
      var filename = scope.parent ? scope.path.join(path.sep) : 'rosetta';
      out.push({
        path: outPath.replace('{{ns}}', filename),
        text: scopeOut.join('')
      });
    }
  }

  return splitFiles ? out : [{
    path: outPath,
    text: out.join('')
  }];
};

var BasicAdapter = classdef({
  constructor: function(template) {
    this._t = _.template(template);
  },

  write: function(symdef, out) {
    var formatter = BasicAdapter._formatters[symdef.value.type];
    if (!formatter) {
      throw new errors.RosettaError('Unsupported output type: ' +
          symdef.value.type);
    }

    var formattedValue = formatter(symdef.value);

    out.push(this._t({
      k: symdef.varname,
      v: formattedValue
    }));
    out.push('\n');

    if (symdef.scope.parent) {  // true if not root
      out.push(this._t({
        k: symdef.scope.path.join('-') + '-' + symdef.varname,
        v: formattedValue
      }));
      out.push('\n');
    }
  },

  _writeNumber: function(number) {
    return number.unit ? number.val.toString() + number.unit : number.val.toString();
  },

  _writeColor: function(color) {
    if (color.a !== null) {
      return 'rgba(' + [color.r, color.g, color.b, color.a].join(',') + ')';
    } else {
      return '#' + ('000000' + color.val.toString(16)).slice(-6);
    }
  },

  _writeString: function(string) {
    return string.wrapChar + string.val + string.wrapChar;
  },

  _writeUrl: function(url) {
    return 'url(' + url.wrapChar + url.val + url.wrapChar + ')';
  },

  _writeIdent: function(ident) {
    return ident.val;
  }
});

BasicAdapter._formatters = {
  'number': BasicAdapter.prototype._writeNumber,
  'color': BasicAdapter.prototype._writeColor,
  'string': BasicAdapter.prototype._writeString,
  'url': BasicAdapter.prototype._writeUrl,
  'ident': BasicAdapter.prototype._writeIdent
};