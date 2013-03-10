'use strict';

var path = require('path');

var rosetta = require('../lib/rosetta');

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('rosetta', 'Shared variables between JS and CSS.', function() {
    console.log('FILES:', this.files);

    var sources = Array.prototype.concat.apply([],
        grunt.util._.pluck(this.files, 'src'));

    console.log('SOURCES:', sources);

    var options = this.options();
    options.jsOut = this.files.jsOut;
    options.cssOut = this.files.cssOut;

    var done = this.async();

    rosetta.compile(sources, options, function(err, outfiles) {
      console.log('STUFF:', outfiles);
      if (err) {
        grunt.log.error(err);
        done(false);
      } else {
        rosetta.writeFiles(outfiles, function(err) {
          if (err) {
            grunt.log.error(err);
            done(false);
          } else {
            var cwd = process.cwd();
            outfiles.forEach(function(ouf) {
              grunt.log.writeln('File ' + path.relative(cwd, ouf.path) +
                  ' written');
            });
            done();
          }
        });
      }
    });

  });

};
