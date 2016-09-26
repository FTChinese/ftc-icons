const path = require('path');
const fs = require('fs');
const co = require('co');
const str = require('string-to-stream');

const helper = require('./helper');

co(function *() {
  const files = yield helper.readDir('svg');
  const names = files.map(file => path.basename(file, '.svg'));

  str(JSON.stringify(names, null, 4))
    .pipe(fs.createWriteStream('icon-list.json'))
})
.then(() => {

}, (e) => {
  console.error(e.stack);
});
