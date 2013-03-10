module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      all: [
        'Gruntfile.js',
        'lib/**/*.js',
        '<%= nodeunit.tests %>',
      ],
      options: {
        jshintrc: '.jshintrc',
      }
    },

    nodeunit: {
      tests: ['test/**/*_test.js']
    },

    watch: {
      all: {
        files: ['<%= jshint.all %>'],
        tasks: 'jshint'
      }
    },

    clean: {
      tmp: ['tmp']
    },

    rosetta: {
      testBasic: {
        src: ['test/basic.rose'],
        options: {
          jsFormat: 'requirejs',
          cssFormat: 'less',
          jsOut: 'tmp/rosetta.js',
          cssOut: 'tmp/css/{{ns}}.less',
        }
      },
    }
  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', ['jshint nodeunit']);

};