var 
fs = require('fs'),
path = require('path'),
browserify = require('browserify'),
shim = require('browserify-shim');

var b = browserify();
shim(b, {
    angular: {
        path: "./bower_components/angular/angular.js", exports: 'angular'
    }
});
b.transform('debowerify');
b.add('./js/app.js');
b.bundle(function(err, src){
    if (!err) {
        fs.writeFileSync(path.join(__dirname, 'bundle.js'));
    }
});


/*


      "watch": "watchify js/app.js -o bundle.js -dv",
browserify js/app.js > bundle.js
            build: {
                dest: './bundle.js',
            },

                callback: function(b) {
                    b.transform('browserify-shim');
                    b.transform('debowerify');
                    b.transform('deamdify');
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
                port: 8080,
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

    grunt.loadNpmTasks('grunt-watchify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-livereload');

    grunt.registerTask('server', ['connect', 'watch']);
    grunt.registerTask('default', ['watchify:build:keepalive']);
};
  "browserify-shim": {
    "./bower_components/jquery/jquery.min.js": "jQuery",
    : "angular",
    "./bower_components/bootstrap/dist/js/bootstrap.min.js": {
        "depends": ["./bower_components/jquery/jquery.min.js:jQuery"],
        "exports": "bootstrap"
    }
  },

  */
