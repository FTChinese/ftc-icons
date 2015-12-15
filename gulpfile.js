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

const rsvg = require('gulp-rsvg');
const svg2png = require('gulp-svg2png');
const spritesmith = require('gulp.spritesmith');

const sequence = require('gulp-sequence');
const browserSync = require('browser-sync').create();

const svgsrc = 'src/*.svg';

//Generate sass variables from svg.
gulp.task('svg2css', function() {
  return gulp.src(svgsrc)
    .pipe(svgmin())
    .pipe(svgToCss({
      name: '_ftc-var.scss',
      prefix: '$',
      template: '{{prefix}}{{filename}}:url("{{{dataurl}}}");'
    }))
    .pipe(gulp.dest('sass'));
});

gulp.task('sassvg', function() {
  return gulp.src('o-ft-icons/svg/*.svg')
    .pipe(svgmin())
    .pipe(sassvg({
      outputFolder: 'sass',
      optimizeSvg: true
    }));
});


//Generate a svg sprite with `symbol` elements
gulp.task('svgsymbol', function() {
  var svgs = gulp.src(svgsrc)
    .pipe(svgmin())
    .pipe(svgstore())
    .pipe(rename('icons.sprite.symbol.svg'))
    .pipe(gulp.dest('sprite'));
});

//Minify svg
gulp.task('svgmin', function() {
  return gulp.src(svgsrc)
    .pipe(svgmin())
    .pipe(gulp.dest('svg'))
    .pipe(browserSync.stream());
});

//Generate png files from svg.
gulp.task('svg2png:brand', function() {
  return gulp.src('src/brand-*.svg')
    .pipe(svg2png(1)) //`1` is scale factor. You can change it.
    .pipe(gulp.dest('png'));
});

//Tasks `svg2png` and `rsvg` are identical functionally. 
//They only differ in the packages used. It seems `svg2png` is much slower than rsvg but it could be easily scaled while you have to explicitly specify the `height` and `width` for `rsvg`, and you have to have `librsvg` installed on your system.
gulp.task('svg2png:icons', function() {
  return gulp.src([svgsrc, '!src/brand-*.svg'])
    .pipe(svg2png(0.32))
    .pipe(gulp.dest('.tmp'))
    .pipe(gulp.dest('png'));
});

gulp.task('svg2png', ['svg2png:brand', 'svg2png:icons']);

//Just an alternative to `svg2png` in case `phantomjs` failed to work.
//This plugin is dependent of `librsvg`. You have to have it installed on your system. On Mac `brew install librsvg`.
gulp.task('rsvg:brand', function() {
  return gulp.src('src/brand-*.svg')
    .pipe(rsvg({
      format: 'png'
    }))
    .pipe(gulp.dest('png'));
});

gulp.task('rsvg:icons', function() {
  return gulp.src([svgsrc, '!src/brand-*.svg'])
    .pipe(rsvg({
      format: 'png',
      scale: 0.32
    }))
    .pipe(gulp.dest('.tmp/png'))
    .pipe(gulp.dest('png'));
});

gulp.task('rsvg', ['rsvg:brand', 'rsvg:icons']);

//PNG sprite.
//It seems inlined `svg` is in confict with png `sprite` because you could not set different `background-position` on the same element.
//For fallback you should not use the png sprite. Just link the individual png files separately.
gulp.task('spritesmith', function() {
  return gulp.src('.tmp/*.png')
    .pipe(spritesmith({
      imgName: 'icons.sprite.png',
      cssName: 'icons.sprite.png.css',
      algorithm: 'top-down',
      padding: 4,
      cssTemplate: 'templates/png.spritecss.handlebars'
    }))
    .pipe(gulp.dest('sprite'));
});

gulp.task('clean', function() {
  return del(['.tmp/**']).then(()=>{
    console.log('Old files deleted');
  });
});

//Combine all tasks together
gulp.task('build', sequence('clean', ['svg2css', 'svgmin', 'svg2png', 'svgsymbol'], 'spritesmith'));

gulp.task('sass', function() {
  return gulp.src('demo/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('.tmp'))
    .pipe(browserSync.stream());
});

gulp.task('serve', ['sass'], function() {
  browserSync.init({
    server: {
      baseDir: ['.tmp', 'demo', '.'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch([
    'demo/*.html',
    '.tmp/styles/*.css'
  ]).on('change', browserSync.reload);

  gulp.watch(['src/*.svg'], ['svg2css', 'svgmin', 'svg2png', 'svgsymbol']);
  gulp.watch(['scss', 'demo/**/*.scss'], ['sass']);
  gulp.watch(['templates/*', '.tmp/png'], ['sprite:png']);
});