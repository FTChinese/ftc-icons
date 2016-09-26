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

})
.then(() => {

}, (e) => {
  console.error(e.stack);
});
