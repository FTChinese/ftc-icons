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
const spritesmith = require('gulp.spritesmith');
const fileInclude = require('gulp-file-include');
const useref = require('gulp-useref');
const sequence = require('gulp-sequence');
const browserSync = require('browser-sync').create();

const svgsrc = 'src/*.svg';

gulp.task('fileinclude', function() {
  gulp.src('demo/index.html')
    .pipe(fileInclude({
      prefix: '@@',
      basepath: 'demo'
    }))
    .pipe(gulp.dest('demo/'));
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

//PNG sprite.
//It seems inlined `svg` is in confict with png `sprite` because you could not set different `background-position` on the same element.
//For fallback you should not use the png sprite. Just link the individual png files separately.
/*gulp.task('spritesmith', function() {
  return gulp.src('.tmp/*.png')
    .pipe(spritesmith({
      imgName: 'icons.sprite.png',
      cssName: 'icons.sprite.png.css',
      algorithm: 'top-down',
      padding: 4,
      cssTemplate: 'templates/png.spritecss.handlebars'
    }))
    .pipe(gulp.dest('sprite'));
});*/

gulp.task('clean', function() {
  return del(['.tmp/**']).then(()=>{
    console.log('Old files deleted');
  });
});

gulp.task('sass', function() {
  return gulp.src('demo/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('.tmp'))
    .pipe(browserSync.stream());
});

//Combine all tasks together
gulp.task('build', sequence('clean', 'svg2css', 'sassvg', 'sass', ['svgmin', 'svg2png']));

gulp.task('serve', ['build'], function() {
  browserSync.init({
    server: {
      baseDir: ['.tmp', 'demo'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch([
    'demo/*.html'
  ]).on('change', browserSync.reload);

  gulp.watch(['src/*.svg'], sequence('svg2css', 'sassvg', ['sass', 'svgmin', 'svg2png'/*, 'svgsymbol'*/]));
  gulp.watch(['demo/styles/*.scss'], ['sass']);
  //gulp.watch(['templates/*', '.tmp/png'], ['sprite:png']);
});

gulp.task('clean:dist', function() {
  return del(['sass/*', 'svg/*', 'png/*']).then(()=>{
    console.log('Clean before distribution');
  });
});

gulp.task('copy', function() {
  gulp.src(['tmp/**/*', '!.tmp/styles'])
    .pipe(gulp.dest('.'));
});

gulp.task('dist', sequence(['clean', 'clean:dist'], 'svg2css', 'sassvg', ['svgmin', 'svg2png'], 'copy'));