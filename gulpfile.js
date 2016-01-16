'use strict'
let fs = require('fs');
let gulp = require('gulp');
let del = require('del');
let sass = require('gulp-sass');

let svgmin = require('gulp-svgmin');
let sassvg = require('gulp-sassvg');
let svgToCss = require('gulp-svg-to-css');
let svgstore = require('gulp-svgstore');

/*const rsvg = require('gulp-rsvg');*/
let svg2png = require('gulp-svg2png');
/*const spritesmith = require('gulp.spritesmith');*/
let mustache = require('gulp-mustache');
let sequence = require('gulp-sequence');
let browserSync = require('browser-sync').create();
let path = require('path');

const svgsrc = 'src/*.svg';

//This task actually has nothing to do with gulp.
//It first reads the file names under a directory.
//If the filenames are resolve, then render template.
gulp.task('demopage', function() {
  var folders = [
    'src',
    'o-ft-icons/svg'
  ];

  var template = 'demo/index.mustache';

  function getFileNames(folder) {

    return new Promise(function(resolve, reject) {
      fs.readdir(folder, function(err, files) {
        if (err) {
          reject(err);
        };

        var filenames = files
        .filter(function(file) {
          return path.extname(file) === '.svg'
        })
        .map(function(file) {
          return file.slice(0, -4);
        });

        resolve(filenames);
      });
    });
  }

  var promisedFileNames = folders.map(getFileNames);

  Promise.all(promisedFileNames)
  .then(function(fileNames) {
    gulp.src(template)
      .pipe(mustache({
        ftcicons: fileNames[0],
        fticons: fileNames[1]
      }, {
        extension: '.html'
      }))
      .pipe(gulp.dest('.tmp'));    
  })
  .catch(function(reason) {
    console.log('Failed because: ' + reason);
  });
});

//Generate sass variables from svg.
gulp.task('svgtocss', function() {
  return gulp.src(svgsrc)
    .pipe(svgmin())
    .pipe(svgToCss({
      name: '_ftc-var.scss',
      prefix: '@function ftc-icon-',
      template: '{{prefix}}{{filename}}(){@return "{{{dataurl}}}"; }'
    }))
    .pipe(gulp.dest('.tmp/sass'));
});

gulp.task('sassvg', function() {
  return gulp.src([svgsrc, 'o-ft-icons/svg/*.svg', '!o-ft-icons/svg/social*.svg'])
    .pipe(svgmin())
    .pipe(sassvg({
      outputFolder: '.tmp/sass',
      optimizeSvg: true
    }));
});


//Generate a svg sprite with `symbol` elements
gulp.task('svgsymbol', function() {
  var svgs = gulp.src(svgsrc)
    .pipe(svgmin())
    .pipe(svgstore())
    .pipe(rename('icons.sprite.symbol.svg'))
    .pipe(gulp.dest('.tmp/sprite'));
});

//Minify and copy svg
gulp.task('svgmin', function() {
  return gulp.src(svgsrc)
    .pipe(svgmin())
    .pipe(gulp.dest('.tmp/svg'))
    .pipe(browserSync.stream());
});

//Generate png files from svg.
gulp.task('svg2png', function() {
  return gulp.src([svgsrc])
    .pipe(svg2png()) //`1` is scale factor. You can change it.
    .pipe(gulp.dest('.tmp/png'));
});

gulp.task('copy:ftsvg', function() {
  gulp.src('o-ft-icons/svg/*.svg')
    .pipe(gulp.dest('.tmp/ftsvg'))
});

gulp.task('clean', function() {
  return del(['.tmp/**']).then(()=>{
    console.log('Old files deleted');
  });
});

gulp.task('sass:watch',function() {
  return gulp.src('demo/main.scss')
    .pipe(sass({
      includePaths: ['.tmp', 'bower_components']
    }).on('error', sass.logError))
    .pipe(gulp.dest('.tmp'))
    .pipe(browserSync.stream({once: true}));
});

gulp.task('svg:watch', sequence(['svgtocss',  'svgmin', 'svg2png'], 'sassvg', 'sass:watch'));

//Combine all tasks together
//Must put sassvg befind other svg-related tasks since sassvg cannot create folder itself.
gulp.task('dev', sequence('clean', ['svgtocss',  'svgmin', 'svg2png', 'demopage',  'copy:ftsvg'], 'sassvg','sass:watch'));

gulp.task('serve:test', ['dev'], function() {
  browserSync.init({
    server: {
      baseDir: ['.tmp', 'demo'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch([
    '.tmp/*.html'
  ]).on('change', browserSync.reload);

  gulp.watch(['src/*.svg'], ['svg:watch']);
  gulp.watch('demo/*.mustache', ['demopage']);
  gulp.watch(['demo/*.scss'], ['sass:watch']);
  //gulp.watch(['templates/*', '.tmp/png'], ['sprite:png']);
});

// This will build the final file for release. Use with caution as it will overwrite all your previous efforts.
gulp.task('clean:build', function() {
  return del('build/**').then(()=>{
    console.log('Clean before distribution');
  });
});

gulp.task('copy:build', function() {
  gulp.src(['.tmp/**/*', '!.tmp/*.*'])
    .pipe(gulp.dest('build'));
});

gulp.task('build', sequence(['clean', 'clean:build'], ['svgtocss',  'svgmin', 'svg2png',  'copy:ftsvg'], 'sassvg', 'copy:build'));

/* =========== End of tasks for developers ===================== */

// Just for view. No file modification.
gulp.task('sass', function() {
  return gulp.src('demo/**/*.scss')
    .pipe(sass({
      includePaths: ['build']
    }).on('error', sass.logError))
    .pipe(gulp.dest('.tmp'))
});

gulp.task('view', sequence('clean', ['demopage', 'sass']));

gulp.task('serve', ['view'], function() {
  browserSync.init({
    server: {
      baseDir: ['.tmp', 'demo', 'build'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });
});

//Tasks `svg2png` and `rsvg` are identical functionally. 
//They only differ in the packages used. It seems `svg2png` is much slower than rsvg but it could be easily scaled while you have to explicitly specify the `height` and `width` for `rsvg`, and you have to have `librsvg` installed on your system.
/*gulp.task('svg2png:icons', function() {
  return gulp.src([svgsrc, '!src/brand-*.svg'])
    .pipe(svg2png(0.32))
    .pipe(gulp.dest('.tmp'))
    .pipe(gulp.dest('png'));
});*/

/*gulp.task('svg2png', ['svg2png:brand', 'svg2png:icons']);*/

//Just an alternative to `svg2png` in case `phantomjs` failed to work.
//This plugin is dependent of `librsvg`. You have to have it installed on your system. On Mac `brew install librsvg`.
// gulp.task('rsvg:brand', function() {
//   return gulp.src('src/brand-*.svg')
//     .pipe(rsvg({
//       format: 'png'
//     }))
//     .pipe(gulp.dest('png'));
// });

// gulp.task('rsvg:icons', function() {
//   return gulp.src([svgsrc, '!src/brand-*.svg'])
//     .pipe(rsvg({
//       format: 'png',
//       scale: 0.32
//     }))
//     .pipe(gulp.dest('.tmp/png'))
//     .pipe(gulp.dest('png'));
// });

// gulp.task('rsvg', ['rsvg:brand', 'rsvg:icons']);