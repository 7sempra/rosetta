'use strict';

var path = require('path');

var rosetta = require('../lib/rosetta');

module.exports = function(grunt) {

  grunt.registerMultiTask('rosetta', 'Shared variables between JS and CSS.', function() {

    var sources = Array.prototype.concat.apply([],
        grunt.util._.pluck(this.files, 'src'));

    var options = this.options();
    var done = this.async();

    rosetta.compile(sources, options, function(err, outfiles) {
      if (err) {
        var errStr = rosetta.formatError(err);
        grunt.fatal(errStr);
        done(false);
      } else {
        rosetta.writeFiles(outfiles, function(err) {
          if (err) {
            grunt.fatal(err);
            done(false);
          } else {
            var cwd = process.cwd();
            outfiles.forEach(function(ouf) {
              grunt.log.ok('File ' + path.relative(cwd, ouf.path) + ' written');
            });
            done();
          }
        });
      }
    });

  });

};
