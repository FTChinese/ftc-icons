const path = require('path');
const fs = require('fs');
const co = require('co');
const str = require('string-to-stream');

const helper = require('./helper');

const src = path.resolve(process.cwd(), 'svg');
const dest = process.cwd();

co(function *() {
  const files = yield helper.readDir(src);
  const names = files.map(file => path.basename(file, '.svg'));

  str(JSON.stringify(names, null, 4))
    .pipe(fs.createWriteStream(`${dest}/icon-list.json`));

  var scssNames = names.map(name => {
    return `'${name}'`;
  });

  str(buildScssList(scssNames))
    .pipe(fs.createWriteStream(`${dest}/src/scss/_icon-list.scss`));
})
.then(() => {

}, (e) => {
  console.error(e.stack);
});

function buildScssList(names) {
  return `$o-icons-list: (${names.join()});`;
}
