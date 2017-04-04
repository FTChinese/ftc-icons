const fs = require('fs-jetpack');
const path = require('path');
const filterFiles = require('./filter-files.js');
const svgDir = path.resolve(process.cwd(), 'fticons/svg');

function scssList(dest) {
  if (!path.isAbsolute(dest)) {
    dest = path.resolve(process.cwd(), dest);
  }
  return fs.listAsync(svgDir)
    .then(filenames => {
      return filterFiles(filenames, false);
    })
    .then(svgs => {
      return svgs.map(svg => {
        return `"${svg}"`;
      }).join(', ');
    })
    .then(list => {
      return `$icon-list: (${list});`;
    })
    .then(scss => {
      return fs.writeAsync(dest, scss);
    })
    .catch(err => {
      throw err;
    });
}

if (require.main === module) {
  scssList('demos/src/icon-list.scss')
    .catch(err => {
      console.log(err);
    });
}

module.exports = scssList
