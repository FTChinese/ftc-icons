const path = require('path');

/*
 * @param {Array} names - Array of files in a directory
 * @param {Boolean} ext - Whether you want to keep the extension in result.
 * @return {Array}
 */
function filterFiles (names, ext=true) {
  const namesKept = names.filter(name => {
    return path.extname(name) === '.svg'
  });

  if (ext) {
    return namesKept;
  }
  return namesKept.map(name => {
    return path.basename(name, '.svg');
  });
}

if (require.main === module) {
  const fs = require('fs-jetpack');
  const svgDir = path.resolve(process.cwd(), 'fticons/svg');
  fs.listAsync(svgDir)
    .then(filenames => {
      return filterNames(filenames);
    })
    .then(result => {
      console.log(result);
    })
    .catch(err => {
      console.log(err);
    });
}

module.exports = filterFiles;