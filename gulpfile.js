const fs = require('fs');
const path = require('path');
const url = require('url');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');
const helper = require('./helper');

const del = require('del');
const browserSync = require('browser-sync').create();
const cssnext = require('postcss-cssnext');

const gulp = require('gulp');
const $ = require('gulp-load-plugins')();

const data = require('./icon-list.json');

const demosDir = '../ft-interact/demos';
const projectName = path.basename(__dirname);

process.env.NODE_ENV = 'dev';

// change NODE_ENV between tasks.
gulp.task('prod', function(done) {
  process.env.NODE_ENV = 'prod';
  done();
});

gulp.task('dev', function(done) {
  process.env.NODE_ENV = 'dev';
  done();
});

// For sassvg, we should remove any redundant path, fill color and only keep a single path for main pattern.
// minify svg templates in `views`
gulp.task('svgmin', () => {
  return gulp.src('templates/*.svg')
    .pipe($.cheerio({
      run: function($, file) {
        $('rect').attr('fill', '{{background}}');
        $('path').attr('fill', '{{foreground}}');
      }
    }))
    .pipe($.svgmin())
    .pipe(gulp.dest('templates'));
});

gulp.task('sassvg', function() {
  return gulp.src('svg/*.svg')
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
      outputFolder: 'sassvg',
      optimizeSvg: true
    }));
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

// /* demo tasks */
gulp.task('html', () => {
// determine whether include `/api/resize-iframe.js` listed in `ftc-components`.
  var embedded = false;

  return co(function *() {
    const destDir = '.tmp';

    if (!isThere(destDir)) {
      mkdirp(destDir, (err) => {
        if (err) console.log(err);
      });
    }
    if (process.env.NODE_ENV === 'prod') {
      embedded = true;
    }

    const origami = yield helper.readJson('origami.json');

    const demos = origami.demos;

    const htmlString = yield Promise.all(demos.map(function(demo) {
      
      const template = demo.template;
      console.log(`Using template "${template}" for "${demo.name}"`);

      const context = {
        pageTitle: demo.name,
        description: demo.description,
        className: 'o-icons__' + demo.name,
        icons: Object.keys(data),
        embedded: embedded
      };

      return helper.render(template, context);
    }));

    demos.forEach(function(demo, i) {
      str(htmlString[i])
        .pipe(fs.createWriteStream('.tmp/' + demo.name + '.html'));
    });     
  })
  .then(function(){
    browserSync.reload('*.html');
  }, function(err) {
    console.error(err.stack);
  });
});

gulp.task('styles', function styles() {
  const DEST = '.tmp/styles';

  return gulp.src('demos/src/demo.scss')
    .pipe($.changed(DEST))
    .pipe($.plumber())
    .pipe($.sourcemaps.init({loadMaps:true}))
    .pipe($.sass({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['bower_components']
    }).on('error', $.sass.logError))
    .pipe($.postcss([
      cssnext({
        features: {
          colorRgba: false
        }
      })
    ]))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(DEST))
    .pipe(browserSync.stream({once: true}));
});

gulp.task('clean', function() {
  return del(['.tmp/**']).then(()=>{
    console.log('Old files deleted');
  });
});

gulp.task('serve', gulp.parallel('html', 'styles', () => {
  browserSync.init({
    server: {
      baseDir: ['.tmp', '.'],
      index: 'icons.html',
      directory: true,
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch(['demos/src/*.{html,json}', 'origami.json'], gulp.parallel('html'));

  gulp.watch([
    'demos/src/*.scss', 
    'src/scss/*.scss',
    'sassvg/*.scss',
    '*.scss'], 
    gulp.parallel('styles')
  );

}));

gulp.task('copy', () => {
  const DEST = path.resolve(__dirname, demosDir, projectName);
  console.log(`Deploying to ${DEST}`);
  return gulp.src(['.tmp/**/*', 'static/**/*.{svg,png,ico}'])
    .pipe(gulp.dest(DEST));
});

gulp.task('demo', gulp.series('clean', gulp.parallel('html', 'styles'), 'copy'));