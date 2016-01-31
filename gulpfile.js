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
let changed = require('gulp-changed');

let mustache = require('gulp-mustache');
let sequence = require('gulp-sequence');
let browserSync = require('browser-sync').create();
let path = require('path');

const svgsrc = 'src/*.svg';

//This task actually has nothing to do with gulp.
//It first reads the file names under a directory.
//If the filenames are resolve, then render template.

gulp.task('html', function() {
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
      .pipe(gulp.dest('demo'))
      .pipe(browserSync.stream({once: true}));    
  })
  .catch(function(reason) {
    console.log('Failed because: ' + reason);
  });
});

//Generate sass variables from svg.
gulp.task('svgtocss', function() {
  const DEST = 'scss';

  return gulp.src(svgsrc)
    .pipe(changed(DEST))
    .pipe(svgmin())
    .pipe(svgToCss({
      name: '_ftc-svg-data.scss',
      prefix: '@function ftc-icon-',
      template: '{{prefix}}{{filename}}(){@return "{{{dataurl}}}"; }'
    }))
    .pipe(gulp.dest(DEST));
});

gulp.task('sassvg', function() {
  return gulp.src(svgsrc)
    .pipe(svgmin({
      plugins: [{
        removeAttrs: { 
          attrs: 'path:fill'
        }
      }]
    }))
    .pipe(sassvg({
      outputFolder: 'scss',
      optimizeSvg: true
    }));
});

//Generate a svg sprite with `symbol` elements
gulp.task('svgstore', function() {
  const DEST = '.tmp/sprite';

  return gulp.src(svgsrc)
    .pipe(changed(DEST))
    .pipe(svgmin({
      plugins: [{
        removeAttrs: { 
          attrs: 'path:fill'
        }
      }]
    }))
    .pipe(svgstore())
    .pipe(gulp.dest(DEST));
});

//Minify and copy svg
gulp.task('svgmin', function() {
  const DEST = '.tmp/svg';

  return gulp.src(svgsrc)
    .pipe(changed(DEST))
    .pipe(svgmin())
    .pipe(gulp.dest(DEST))
    .pipe(browserSync.stream({onece: true}));
});

//Generate png files from svg.
gulp.task('svg2png', function() {
  const DEST = '.tmp/png';

  return gulp.src(svgsrc)
    .pipe(changed(DEST))
    .pipe(svg2png()) //`1` is scale factor. You can change it.
    .pipe(gulp.dest());
});

gulp.task('copy:ftsvg', function() {
  gulp.src('o-ft-icons/svg/*.svg')
    .pipe(gulp.dest('.tmp/ftsvg'));
});

gulp.task('clean', function() {
  return del(['.tmp/**']).then(()=>{
    console.log('Old files deleted');
  });
});

gulp.task('style:watch', ['svgtocss', 'sassvg'], function() {
  return gulp.src('demo/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('.tmp'))
    .pipe(browserSync.stream({once: true}));
});

gulp.task('svg:watch', ['svgmin', /*'svg2png',*/ 'svgstore']);

//Combine all tasks together
//Must put sassvg befind other svg-related tasks since sassvg cannot create folder itself.
gulp.task('dev', sequence('clean', ['svgmin', /*'svg2png',*/ 'svgstore', 'copy:ftsvg'], 'style:watch'));

gulp.task('serve:test', ['html', 'dev'], function() {
  browserSync.init({
    server: {
      baseDir: ['.tmp', 'demo'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch(['src/*.svg'], ['svg:watch', 'style:watch', 'html']);
  gulp.watch('demo/*.mustache', ['html']);
  gulp.watch(['demo/*.scss'], ['style:watch']);
});

// This will build the final file for release. Use with caution as it will overwrite all your previous efforts.
gulp.task('clean:assets', function() {
  return del('assets/**').then(function() {
    console.log('Clean before build');
  });
});

gulp.task('copy:assets', function() {
  return gulp.src(['.tmp/**/*', '!.tmp/*.*'])
    .pipe(gulp.dest('assets'));
});

gulp.task('assets', sequence('clean:assets', ['svgmin', 'svg2png', 'svgstore', 'copy:ftsvg'], 'copy:assets'));

/* =========== End of tasks for developers ===================== */

// Just for view. No file modification.
gulp.task('styles', ['clean'], function() {
  return gulp.src('demo/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('.tmp'));
});

gulp.task('serve', ['styles'], function() {
  browserSync.init({
    server: {
      baseDir: ['demo', '.tmp', 'assets'],
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