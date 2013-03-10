
var fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    classdef = require('classdef'),
    mkdirp = require('mkdirp');


var debug = require('./debug');
var errors = require('./errors');
var lexer = require('./lexer');
var parser = require('./parser');
var Resolver = require('./Resolver');

var css = require('./output/css');
var js = require('./output/js');

/**
 * Options:
 *  jsFormat    Name of JS format. Accepts {'commonjs', 'requirejs', 'flat'}.
 *              Default: 'commonjs'. You can also define your own format; see
 *              'jsTemplate'.
 *  cssFormat   Accepts {'stylus', 'sass', 'scss', 'less'}. Default: 'stylus'.
 *              You can also define your own format; see 'cssTemplate'.
 *  jsTemplate  An underscore-formatted template string to be used when
 *              generating the compiled JS. Must contain slots for variables
 *              named 'preamble' and 'blob'. See lib/output/jstemplates for
 *              an example.
 *  cssTemplate An underscore-formatted template string that defines how a
 *              single variable should be defined. For example, the stylus
 *              template is '$<%= k %> = <%= v %>'. Must contain slots for
 *              variables named 'k' (name of the variable) and 'v' (value of the
 *              variable).
 *  debug       If true, print tons of stuff to the console.
 */
exports.compile = function(sources, options, callback) {

  _.defaults(options, {
    jsFormat: 'commonjs',
    cssFormat: 'stylus',
    jsOut: 'rosetta.js',
    cssOut: 'rosetta.' + css.getFileExtension(options.cssFormat || 'stylus') || 'css'
  });

  var resolver = new Resolver();
  var outfiles = [];

  var parseComplete = _.after(sources.length, function() {
    var resolvedScope;
    if (options.debug) {
      console.log('\nParse complete. Scope tree:')
      resolver.printScopeTree();
    }
    try {
      resolvedScope = resolver.resolve();
    } catch (e) {
      _handleError(e);
    }

    outfiles = css.compile(resolvedScope, options);
    compileComplete();
    if (options.debug) {
      console.log('\nCSS:');
      console.log(  '----');
      console.log(outfiles);
    }

    js.compile(resolvedScope, options, function(err, result) {
      // TODO: catch this error?

      if (options.debug) {
        console.log('\nJavascript:');
        console.log(  '-----------');
        console.log(result.text);
      }

      outfiles.push(result);
      compileComplete();
    });
  });

  var compileComplete = _.after(2, function() {
    callback(null, outfiles);
    /*var writeComplete = _.after(outfiles.length, onWritesComplete);

    for (var a = 0; a < outfiles.length; a++) {
      var file = outfiles[a];
      //console.log('Writing', file.path + '...');
      fs.writeFile(file.path, file.text, 'utf8', function(err) {
        if (err) {
          throw err;
        }
        writeComplete();
      });
    }*/
  });

  /*function onWritesComplete() {
    callback(null, _.pluck(outfiles, 'path'));
  }*/

  _.each(sources, function(source) {
    parseFile(path.resolve(source), options, function(ast) {
      resolver.addAst(ast);
      parseComplete();
    });
  });
}

exports.writeFiles = function(outfiles, callback) {

  writeFile(0);

  function writeFile(a) {
    if (a >= outfiles.length) {
      callback();
      return;
    }

    var file = outfiles[a];
    fs.writeFile(file.path, file.text, 'utf8', function(err) {
      if (err) {
        if (err.code == 'ENOENT') {
          mkdirp(path.dirname(file.path), function(err) {
            if (err) {
              callback(err);
            } else {
              writeFile(a);
            }
          });
        } else {
          callback(err);
        }
      } else {
        writeFile(a + 1);
      }
    });
  }
}

function parseFile(path, options, callback) {
  fs.readFile(path, 'utf8', function(err, data) {
    if (err) {
      _die('Error reading ' + path + ':', err);
    }

    var file = new SourceFile(path, data);

    options.debug && console.log('Parsing', path);
    try {
      var tokens = lexer.lex(file);
      options.debug && console.log(debug.printTokenStream(tokens));
      var ast = parser.parse(tokens);
      options.debug && console.log(debug.printAst(ast));
      callback(ast);

    } catch (e) {
      _handleError(e);
    }
  });
}

function _die(message, code) {
  if (code == null) {
    code = 1;
  }
  process.stdout.write(message);
  process.exit(code);
}

function _handleError(e) {
  if (e instanceof errors.CompileError) {
    _printError(e);
    process.exit(1);
  } else {
    throw e;
  }
}

function _printError(e) {
  console.log('SUP?');
  var out = process.stdout;
  var token = e.token;
  var linePreamble = token.line + '| ';

  out.write(e.type + ': ' + e.message);
  out.write('\n\n');

  out.write(token.src.path);
  out.write(':\n');

  out.write(_getRepeatedChar(token.src.path.length + 1, '-'));
  out.write('\n');

  out.write(linePreamble);
  out.write(_getLine(token.line, token.src.text));
  out.write('\n');

  out.write(_getRepeatedChar(linePreamble.length + token.linePos));
  out.write('^\n');
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

var SourceFile = classdef({
  constructor: function(path, text) {
    this.path = path;
    this.text = text;
  }
});