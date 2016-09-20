const path = require('path');
const fs = require('fs');
const merge = require('merge-stream');
const gulp = require('gulp');
const del = require('del');
const $ = require('gulp-load-plugins')();
const browserSync = require('browser-sync').create();
const lazypipe = require('lazypipe');

const projectName = path.basename(__dirname);
const demoPath = '../ft-interact/';

const svgsrc = 'src/*.svg';

// For sassvg, we should remove any redundant path, fill color and only keep a single path for main pattern.
// minify svg templates in `views`
gulp.task('svgmin', () => {
  return gulp.src('views/*.svg')
    .pipe($.cheerio({
      run: function($, file) {
        $('rect').attr('fill', '{% if background %}{{background}}{% endif %}');
        $('path').attr('fill', '{% if foreground %}{{foreground}}{% endif %}');
      }
    }))
    .pipe($.svgmin())
    .pipe(gulp.dest('views'));
});

gulp.task('sassvg', function() {
  return gulp.src('src/**/*.svg')
    .pipe($.svgmin(/*{
      plugins: [{
        removeAttrs: { 
          attrs: 'path:fill'
        }
      }]
    }*/))
    .pipe($.cheerio({
      run: function($, file) {
        $('rect').remove();
        $('path').removeAttr('fill')
      },
      parserOptions: {
        xmlMode: true
      }
    }))
    .pipe($.sassvg({
      outputFolder: 'scss/sassvg',
      optimizeSvg: true
    }));
});

const svgStore = lazypipe()
  .pipe($.svgmin)
  .pipe($.cheerio, {
      run: function($, file) {
        $('rect').remove();
        $('path').removeAttr('fill')
      },
      parserOptions: {
        xmlMode: true
      }
    })
    .pipe($.svgstore);

//Generate a svg sprite with `symbol` elements
gulp.task('svgsprite', function() {
  const DEST = '.tmp/sprite';

  return gulp.src(['src/*.svg', 'src/social-icons/*.svg'])
    .pipe(svgStore())
    .pipe($.rename({basename: 'all-icons'}))
    .pipe(gulp.dest(DEST));
});

// Generate individual svg and png.
gulp.task('svgpng', function() {
  const DEST = '.tmp/png';
  return gulp.src('svg/*.svg')
    .pipe($.svgmin())
    .pipe($.svg2png()) //`1` is scale factor. You can change it.
    .pipe(gulp.dest(DEST));
});

// Generate favicons
gulp.task('fav', function() {
  return gulp.src('src/brand-ftc-square.svg')
    .pipe($.svg2png(2))
    .pipe($.favicons({
      appName: 'icons',
      background: '#FFCC99',
      icons: {
        android: false,              // Create Android homescreen icon. `boolean`
        appleIcon: true,            // Create Apple touch icons. `boolean`
        appleStartup: false,         // Create Apple startup images. `boolean`
        coast: false,                // Create Opera Coast icon. `boolean`
        favicons: true,             // Create regular favicons. `boolean`
        firefox: false,              // Create Firefox OS icons. `boolean`
        opengraph: false,            // Create Facebook OpenGraph image. `boolean`
        twitter: false,              // Create Twitter Summary Card image. `boolean`
        windows: false,              // Create Windows 8 tile icons. `boolean`
        yandex: false                // Create Yandex browser icon. `boolean`
      }
    }))
    .pipe(gulp.dest('.tmp/favicons'));
});

/* demo tasks */
gulp.task('clean', function() {
  return del(['.tmp/**']).then(()=>{
    console.log('Old files deleted');
  });
});

gulp.task('styles', function() {
  return gulp.src('demo/main.scss')
    .pipe($.sass({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['bower_components']
    }).on('error', $.sass.logError))
    .pipe(gulp.dest('.tmp'))
    .pipe(browserSync.stream({once: true}));
});

// gulp.task('build', gulp.series('clean', gulp.parallel('sassvg', 'svgsprite', 'svgpng', 'social', 'white', 'fav', 'mustache')));

// Run `gulp build` before this task.
// Split into two steps due to complicated asynchronous management and heavy IO.
// gulp.task('dev', 
//   gulp.parallel(
//     'mustache', 'styles', 
//     function serve() {
//       browserSync.init({
//         server: {
//           baseDir: ['.tmp'],
//           routes: {
//             '/bower_components': 'bower_components'
//           }
//         }
//       });

//       gulp.watch('src/*.svg', gulp.series(gulp.parallel('sassvg', 'svgsprite', 'mustache'), 'styles'));
//       gulp.watch('demo/*.mustache', gulp.parallel('mustache'));
//       gulp.watch(['demo/*.scss', 'scss/*.scss'], gulp.parallel('styles'));
//     }
//   )
// );

// // deploy to server for demo
// gulp.task('copy:demo', function() {
//   console.log('Copying files to: ' + demoPath + projectName);
//   return gulp.src('.tmp/**/**.{svg,png,css,html}')
//     .pipe(gulp.dest(demoPath + projectName));
// });

// gulp.task('demo', gulp.series('mustache', 'build', 'styles', 'copy:demo'));

// gulp.task('deploy', function() {
//   return gulp.src('.tmp/**/**/*.{svg,png,ico}')
//     .pipe(gulp.dest('../dev_www/frontend/static/ftc-icons'))
// })
// // build the final file for release. 
// gulp.task('clean:assets', function() {
//   return del(['png/*', 'svg/*', 'sprite/*']).then(function() {
//     console.log('Clean before final dist');
//   });
// });

// gulp.task('copy:dist', function() {
//   return gulp.src('.tmp/**/*.{svg,png}')
//     .pipe(gulp.dest('.'));
// });

// gulp.task('dist',gulp.series('clean', 'build', 'copy:dist'));



// /* =========== End of tasks for developers ===================== */

// // Just for view. No file modification.

// gulp.task('serve', 
//   gulp.series('clean', 'mustache', 'styles', 
//     function serve() {
//       browserSync.init({
//         server: {
//           baseDir: ['.tmp', '.']
//         }
//       });
//     }
//   )
// );