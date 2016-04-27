const path = require('path');
const fs = require('fs');
const merge = require('merge-stream');
const gulp = require('gulp');
const del = require('del');
const $ = require('gulp-load-plugins')();
const browserSync = require('browser-sync').create();
const lazypipe = require('lazypipe');

const projectName = path.basename(__dirname);
const demoPath = '../../ftrepo/ft-interact/';

const svgsrc = 'src/*.svg';

// For sassvg, we should remove any redundant path, fill color and only keep a single path for main pattern.
// Do not put src/varitants into sassvg or symbol sprite.
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

gulp.task('socialsprite', function() {
  const DEST = '.tmp/sprite';

  return gulp.src(['src/social-icons/*.svg'])
    .pipe(svgStore())
    .pipe($.rename({basename: 'social-icons'}))
    .pipe(gulp.dest(DEST));
});

gulp.task('oftenused', function() {
  const DEST = '.tmp/sprite';

  return gulp.src(['src/arrow*.svg', 'src/cross.svg', 'src/hamburger.svg'])
    .pipe(svgStore())
    .pipe($.rename({basename: 'arrow-hamburger-cross'}))
    .pipe(gulp.dest(DEST));
});

// Generate individual svg and png.
gulp.task('svgpng', function() {
  const svg = '.tmp/svg';
  const png = '.tmp/png';
  return gulp.src('src/*.svg')
    .pipe($.svgmin())
    .pipe(gulp.dest(svg))
    .pipe($.svg2png()) //`1` is scale factor. You can change it.
    .pipe(gulp.dest(png));
});

// Use one source file to generate different social icons.
gulp.task('social', function() {
  const social = gulp.src('src/social-icons/*.svg')
    .pipe($.svgmin())
    .pipe($.cheerio({
      run: function($, file) {
          var rect = $('rect').remove();
          var bgColor = rect.attr('fill');
          $('path').attr('fill', bgColor);
        },
      parserOptions: {
        xmlMode: true
      }
    }))
    .pipe(gulp.dest('.tmp/svg'))
    .pipe($.svg2png())
    .pipe(gulp.dest('.tmp/png'));

  const roundHollow = gulp.src('src/social-icons/*.svg')
    .pipe($.svgmin())
    .pipe($.cheerio({
      run: function($, file) {
          $('rect').attr('rx', '50%').attr('ry', '50%');
        },
      parserOptions: {
        xmlMode: true
      }
    }))
    .pipe($.rename(function(path) {
      path.basename += '-round-hollow'
    }))
    .pipe(gulp.dest('.tmp/svg'))
    .pipe($.svg2png())
    .pipe(gulp.dest('.tmp/png'));

  const hollow = gulp.src('src/social-icons/*.svg')
    .pipe($.svgmin())
    .pipe($.rename(function(path){
      path.basename += '-hollow'
    }))
    .pipe(gulp.dest('.tmp/svg'))
    .pipe($.svg2png())
    .pipe(gulp.dest('.tmp/png'));

  return merge(social, roundHollow, hollow)
});

// generate a white version of each file by setting the `fill` attribute on all path to `#ffffff`
// If the file has `rect` with classname `background`, set its `fill` to `#000000`
gulp.task('white', function() {
  return gulp.src(['src/*.svg', 'src/social-icons/*.svg'])
    .pipe($.svgmin())
    .pipe($.cheerio({
      run: function($, file) {
        $('rect.background').remove();
        $('path').attr('fill', '#ffffff');
      },
      parserOptions: {
        xmlMode: true
      }      
    }))
    .pipe($.rename(function(path) {
      path.basename += '-white';
    }))
    .pipe(gulp.dest('.tmp/svg/white'))
    .pipe($.svg2png())
    .pipe(gulp.dest('.tmp/png/white'));
});


/* demo tasks */
gulp.task('clean', function() {
  return del(['.tmp/**']).then(()=>{
    console.log('Old files deleted');
  });
});

//It first reads the file names under a directory.
//If the filenames are resolveed, then render template.

gulp.task('mustache', function() {
  var folders = [
    'src',
    'src/social-icons'
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

  return Promise.all(promisedFileNames)
  .then(function(fileNames) {
    gulp.src(template)
      .pipe($.mustache({
        ftcicons: fileNames[0],
        socialicons: fileNames[1]
      }, {
        extension: '.html'
      }))
      .pipe(gulp.dest('.tmp'))
      .pipe(browserSync.stream({once: true}));    
  })
  .catch(function(reason) {
    console.log('Failed because: ' + reason);
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

gulp.task('build', gulp.series('clean', gulp.parallel('sassvg', 'svgsprite', 'svgpng', 'social', 'white', 'mustache')));

// Run `gulp build` before this task.
// Split into two steps due to complicated asynchronous management and heavy IO.
gulp.task('dev', 
  gulp.parallel(
    'mustache', 'styles', 
    function serve() {
      browserSync.init({
        server: {
          baseDir: ['.tmp'],
          routes: {
            '/bower_components': 'bower_components'
          }
        }
      });

      gulp.watch('src/*.svg', gulp.series(gulp.parallel('sassvg', 'svgsprite', 'mustache'), 'styles'));
      gulp.watch('demo/*.mustache', gulp.parallel('mustache'));
      gulp.watch(['demo/*.scss', 'scss/*.scss'], gulp.parallel('styles'));
    }
  )
);

// deploy to server for demo
gulp.task('copy:deploy', function() {
  console.log('Copying files to: ' + demoPath + projectName);
  return gulp.src('.tmp/**/**.{svg,png,css,html}')
    .pipe(gulp.dest(demoPath + projectName));
});

gulp.task('deploy', gulp.series('mustache', 'build', 'styles', 'copy:deploy'));


// build the final file for release. 
gulp.task('clean:assets', function() {
  return del(['png/*', 'svg/*', 'sprite/*']).then(function() {
    console.log('Clean before final dist');
  });
});

gulp.task('copy:dist', function() {
  return gulp.src('.tmp/**/*.{svg,png}')
    .pipe(gulp.dest('.'));
});

gulp.task('dist',gulp.series('clean', 'build', 'copy:dist'));

// Generate favicons
gulp.task('fav', function() {
  return gulp.src('assets/svg/brand-ftc.svg')
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
    .pipe(gulp.dest('favicons'));
});

/* =========== End of tasks for developers ===================== */

// Just for view. No file modification.

gulp.task('serve', 
  gulp.series('clean', 'mustache', 'styles', 
    function serve() {
      browserSync.init({
        server: {
          baseDir: ['.tmp', '.']
        }
      });
    }
  )
);


//Just an alternative to `svg2png` in case `phantomjs` failed to work.
//This plugin is dependent of `librsvg`. You have to have it installed on your system. On Mac `brew install librsvg`.
// gulp.task('rsvg', function() {
//   return gulp.src([svgsrc, '!src/brand-*.svg'])
//     .pipe(rsvg({
//       format: 'png',
//       scale: 0.32
//     }))
//     .pipe(gulp.dest('.tmp/png'))
//     .pipe(gulp.dest('png'));
// });