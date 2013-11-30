'use strict';

var path = require('path');

var rosetta = require('../lib/rosetta');

module.exports = function(grunt) {

  grunt.registerMultiTask('rosetta', 'Shared variables between JS and CSS.', function() {

    var sources = Array.prototype.concat.apply([],
        grunt.util._.pluck(this.files, 'src'));

    var options = this.options();

    try {
      var outfiles = rosetta.compile(sources, options);
      rosetta.writeFiles(outfiles);
      var cwd = process.cwd();
      outfiles.forEach(function(ouf) {
        grunt.log.ok('File ' + path.relative(cwd, ouf.path) + ' written');
      });
    } catch (e) {
      if (e instanceof rosetta.RosettaError) {
        grint.fatal(rosetta.formatError(e));
      } else {
        throw e;
      }
    }

  });

};
