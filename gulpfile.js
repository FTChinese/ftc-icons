'use strict'
const fs = require('fs');
const gulp = require('gulp');
const del = require('del');
const sass = require('gulp-sass');
const rename = require('gulp-rename');

const svgmin = require('gulp-svgmin');
const sassvg = require('gulp-sassvg');
const svgToCss = require('gulp-svg-to-css');
const svgstore = require('gulp-svgstore');

/*const rsvg = require('gulp-rsvg');*/
const svg2png = require('gulp-svg2png');
/*const spritesmith = require('gulp.spritesmith');*/
const mustache = require('gulp-mustache');
const useref = require('gulp-useref');
const sequence = require('gulp-sequence');
const browserSync = require('browser-sync').create();

const svgsrc = 'src/*.svg';

//This task actually has nothing to do with gulp.
//It first reads the file names under a directory.
//If the filenames are resolve, then render template.
gulp.task('demopage', function() {
  var folder = 'o-ft-icons/svg';
  var template = 'demo/index.mustache';
  var filenames = [];

  var p = new Promise(function(resolve, reject) {
    fs.readdir(folder, function(err, files) {
      if (err) throw err;
      filenames = files.map(function(filename) {
        return filename.slice(0, -4);
      });
      resolve(filenames);
    });
  });

  p.then(function(val) {
    gulp.src(template)
      .pipe(mustache({
        fticons: val
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
gulp.task('svg2css', function() {
  return gulp.src(svgsrc)
    .pipe(svgmin())
    .pipe(svgToCss({
      name: '_ftc-var.scss',
      prefix: '$',
      template: '{{prefix}}{{filename}}:url("{{{dataurl}}}");'
    }))
    .pipe(gulp.dest('.tmp/sass'));
});

gulp.task('sassvg', function() {
  return gulp.src([svgsrc, 'o-ft-icons/svg/*.svg', '!o-ft-icons/svg/social*.svg'])
    .pipe(useref())
    .pipe(svgmin())
    .pipe(sassvg({
      outputFolder: '.tmp/sass',
      optimizeSvg: true
    }));
});


//Generate a svg sprite with `symbol` elements
/*gulp.task('svgsymbol', function() {
  var svgs = gulp.src(svgsrc)
    .pipe(svgmin())
    .pipe(svgstore())
    .pipe(rename('icons.sprite.symbol.svg'))
    .pipe(gulp.dest('sprite'));
});*/

//Minify and copy svg
gulp.task('svgmin', function() {
  return gulp.src(svgsrc)
    .pipe(useref())
    .pipe(svgmin())
    .pipe(gulp.dest('.tmp/svg'))
    .pipe(browserSync.stream());
});

//Generate png files from svg.
gulp.task('svg2png', function() {
  return gulp.src([svgsrc/*, 'o-ft-icons/svg/*.svg', '!o-ft-icons/svg/social*.svg'*/])
    .pipe(svg2png()) //`1` is scale factor. You can change it.
    .pipe(gulp.dest('.tmp/png'));
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
      includePaths: ['.tmp']
    }).on('error', sass.logError))
    .pipe(gulp.dest('.tmp'))
    .pipe(browserSync.stream({once: true}));
});

gulp.task('svg:watch', sequence(['svg2css',  'svgmin', 'svg2png'], 'sassvg', 'sass:watch'));

//Combine all tasks together
//Must put sassvg befind other svg-related tasks since sassvg cannot create folder itself.
gulp.task('dev', sequence('clean', ['svg2css',  'svgmin', 'svg2png', 'demopage',  'copy:ftsvg'], 'sassvg','sass:watch'));

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

gulp.task('build', sequence(['clean', 'clean:build'], ['svg2css',  'svgmin', 'svg2png',  'copy:ftsvg'], 'sassvg', 'copy:build'));

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