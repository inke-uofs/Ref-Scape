'use strict';

var path = require('path');

var lrSnippet  = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var mountFolder = function(connect, dir) {
  return connect.static(path.resolve(dir));
};

module.exports = function (grunt) {
    grunt.initConfig({
        watchify: {
            build: {
                src: ['./js/**/*.js'],
                dest: './bundle.js',
            },
            options: {
                debug: true,
                callback: function(b) {
                    b.transform('debowerify');
                    b.transform('deamdify');
                    b.transform('browserify-shim');
                    return b;
                }
            },
        },
        watch: {
            app: {
                files: './bundle.js',
                options: {
                    livereload: true
                }
            }
        },
        connect: {
            options: {
                port: 8000,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    middleware: function (connect) {
                        return [
                            lrSnippet,
                            mountFolder(connect, './')
                        ];
                    }
                }
            }
        }
    });

    //grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-watchify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-livereload');

    grunt.registerTask('server', ['watchify', 'connect', 'watch']);
    grunt.registerTask('default', ['watchify:build:keepalive']);
};
