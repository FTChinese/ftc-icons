var path = require('path');
var fs = require('fs');
var merge = require('merge-stream');
var gulp = require('gulp');
var del = require('del');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync').create();
var lazypipe = require('lazypipe');

var config = require('./config.json');
var projectName = path.basename(__dirname);

const svgsrc = 'src/*.svg';

//It first reads the file names under a directory.
//If the filenames are resolveed, then render template.

gulp.task('html', function() {
  var folders = [
    'src'
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
        ftcicons: fileNames[0]
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

//Generate sass variables from svg.
gulp.task('svgtocss', function() {
  const DEST = '.tmp/scss';

  return gulp.src(svgsrc)
    .pipe($.changed(DEST))
    .pipe($.svgmin())
    .pipe($.svgToCss({
      name: '_ftc-svg-data.scss',
      prefix: '@function ftc-icon-',
      template: '{{prefix}}{{filename}}(){@return "{{{dataurl}}}"; }'
    }))
    .pipe(gulp.dest(DEST));
});

gulp.task('sassvg', function() {
  return gulp.src(svgsrc)
    .pipe($.if('brand-ftc.svg', $.useref()))
    .pipe($.svgmin({
      plugins: [{
        removeAttrs: { 
          attrs: 'path:fill'
        }
      }]
    }))
    .pipe($.sassvg({
      outputFolder: '.tmp/scss',
      optimizeSvg: true
    }));
});

//Generate a svg sprite with `symbol` elements
var svgSymbol = lazypipe()
  .pipe($.svgmin, {      
    plugins: [{
        removeAttrs: { 
          attrs: 'path:fill'
        }
      }]
    })
  .pipe($.svgstore);

gulp.task('svgsprite', function() {
  const DEST = '.tmp/sprite';

  return gulp.src('src/*.svg')
    .pipe($.changed(DEST))
    .pipe(svgSymbol())
    .pipe($.rename({basename: 'ftc-icons-symbol'}))
    .pipe(gulp.dest(DEST));
});

gulp.task('logo', function() {
  const DEST = '.tmp/logo';
  const sprite = gulp.src('src/brand-ftc*.svg')
    .pipe(svgSymbol())
    .pipe($.rename({basename: 'logo'}))
    .pipe(gulp.dest(DEST));

  const png = gulp.src('src//brand-ftc*.svg')
    .pipe($.svg2png())
    .pipe($.rename({
      prefix: 'logo.svg.'
    }))
    .pipe(gulp.dest(DEST));

    return merge(sprite, png);
});


//Minify and copy svg
gulp.task('svg', function() {
  const DEST = '.tmp/svg';

  return gulp.src(svgsrc)
    .pipe($.changed(DEST))
    .pipe($.svgmin())
    .pipe(gulp.dest(DEST));
});

//Generate png files from svg.
gulp.task('png', function() {
  const DEST = '.tmp/png';

  return gulp.src(svgsrc)
    .pipe($.changed(DEST))
    .pipe($.svg2png()) //`1` is scale factor. You can change it.
    .pipe(gulp.dest(DEST));
});

gulp.task('clean', function() {
  return del(['.tmp/**']).then(()=>{
    console.log('Old files deleted');
  });
});

gulp.task('style', function() {
  return gulp.src('demo/main.scss')
    .pipe($.sass({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['scss', '.tmp/scss']
    }).on('error', $.sass.logError))
    .pipe(gulp.dest('.tmp'))
    .pipe(browserSync.stream({once: true}));
});

gulp.task('watch', 
  gulp.series(
    'clean', 
    gulp.parallel('html', 'svgtocss', 'svg', 'png', 'svgsprite', 'logo'),
    'sassvg',
    'style', 
    function serve() {
      browserSync.init({
        server: {
          baseDir: ['.tmp'],
          routes: {
            '/bower_components': 'bower_components'
          }
        }
      });

      gulp.watch('src/*.svg', gulp.series(gulp.parallel('html', 'svgtocss', 'svg', 'png', 'svgsprite'), 'sassvg', 'style'));
      gulp.watch('demo/*.mustache', gulp.parallel('html'));
      gulp.watch(['demo/*.scss', 'scss/*.scss'], gulp.parallel('style'));
    }
  )
);

gulp.task('build', gulp.series('clean', gulp.parallel('html', 'svgtocss', 'svg', 'png', 'svgsprite', 'logo'), 'sassvg'));

// deploy to server for demo
gulp.task('copy:deploy', function() {
  console.log('Copying files to: ' + config.deploy.assets + projectName);
  return gulp.src('.tmp/**/**.{svg,png,css,html}')
    .pipe(gulp.dest(config.deploy.assets + projectName));
});

gulp.task('deploy', gulp.series('build', 'style', 'copy:deploy'));


// build the final file for release. 
gulp.task('clean:assets', function() {
  return del('assets/**').then(function() {
    console.log('Clean before final dist');
  });
});

gulp.task('copy:dist', function() {
  return gulp.src('.tmp/**/*.{svg,png,scss}')
    .pipe(gulp.dest('assets'));
});

gulp.task('dist',gulp.series('build', 'copy:dist'));

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
gulp.task('css', function css() {
  return gulp.src('demo/*.scss')
    .pipe($.sass({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['scss', 'assets/scss']
    }).on('error', $.sass.logError))
    .pipe(gulp.dest('.tmp'));
});

gulp.task('serve', 
  gulp.series('clean', 'html', 'css', 
    function serve() {
      browserSync.init({
        server: {
          baseDir: ['.tmp', 'assets'],
          routes: {
            '/bower_components': 'bower_components'
          }
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