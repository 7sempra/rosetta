
var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    classdef = require('classdef'),
    mkdirp = require('mkdirp');


var debug = require('./debug'),
    errors = require('./errors'),
    lexer = require('./lexer'),
    parser = require('./parser'),
    util = require('./util'),
    Resolver = require('./Resolver');

var css = require('./output/css'),
    js = require('./output/js');

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
exports.compile = function(sources, options, cb) {
  if (cb) {
    console.error('The JS API has changed and no longer uses callbacks. ' +
        'Please see the updated docks.');
    return;
  }

  _.defaults(options, {
    jsFormat: 'commonjs',
    cssFormat: 'stylus',
    jsOut: 'rosetta.js',
    cssOut: 'rosetta.' + css.getFileExtension(options.cssFormat || 'stylus') ||
        'css'
  });

  var resolver = new Resolver();

  for (var a = 0; a < sources.length; a++) {
    var ast = parseFile(path.resolve(sources[a]), options);
    resolver.addAst(ast);
  }

  if (options.debug) {
    console.log('\nParse complete. Scope tree:')
    resolver.printScopeTree();
  }
  var resolvedScope = resolver.resolve();

  var outfiles = css.compile(resolvedScope, options);
  if (options.debug) {
    outfiles.forEach(function(outFile) {
      console.log(util.formatHeading(outFile.path + ':'));
      console.log(outFile.text);
    });
  }

  var jsFile = js.compile(resolvedScope, options);
  if (options.debug) {
    _printHeading(result.path + ':');
    console.log(result.text);
  }
  outfiles.push(jsFile);

  return outfiles;
}

exports.writeFiles = function(outfiles) {
  for (var a = 0; a < outfiles.length; a++) {
    var outfile = outfiles[a];
    mkdirp.sync(path.dirname(outfile.path))
    fs.writeFileSync(outfile.path, outfile.text, 'utf8');
  }
}

exports.formatError = util.formatError;
exports.RosettaError = errors.RosettaError;

function parseFile(path, options) {
  var fileStr = fs.readFileSync(path, 'utf8');
  var file = new SourceFile(path, fileStr);

  options.debug && console.log('Parsing', path);
  var tokens = lexer.lex(file);
  options.debug && console.log(debug.printTokenStream(tokens));
  var ast = parser.parse(tokens);
  options.debug && console.log(debug.printAst(ast));
  return ast;
}

function _getRepeatedChar(len, char) {
  char = char || ' ';
  return new Array(len + 1).join(char);
}

function _printHeading(heading, maxWidth) {
  maxWidth = maxWidth || 79;

  if (heading.length > maxWidth) {
    heading = '...' + heading.substr(heading.length - (maxWidth - 3));
  }
  console.log('\n' + heading);
  console.log(_getRepeatedChar(heading.length, '-'));
}

var SourceFile = classdef({
  constructor: function(path, text) {
    this.path = path;
    this.text = text;
  }
});