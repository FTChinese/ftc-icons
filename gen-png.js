const fs = require('fs');
const path = require('path');
const url = require('url');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');
const svg2png = require('svg2png');
const glob = require('glob');

const helper = require('./helper');

// generate svgs from templates in `views` with `icon-list` as template context.
co(function *() {
	const destDir = '.tmp';
	const meta = {};

    if (!isThere(destDir)) {
      mkdirp(destDir, (err) => {
        if (err) console.log(err);
      });
    }

    const iconNames = yield helper.readDir('svg');
    const destNames = iconNames.map((iconName) => {
      return `.tmp/${iconName.slice(0, -4)}.png`;
    });

    const iconPath = iconNames.map(function(iconName) {
        return path.resolve('svg', iconName)
    });

    const svgs = yield Promise.all(iconPath.map(helper.readFile));
    
    svgs.map(function(svg, i) {
      console.log(`Converting ${iconNames[i]}`);
      svg2png(svg)
        .then(buffer => {
          fs.writeFile(destNames[i], buffer)
        })
        .catch(e => console.error(e));
    });
    // iconNames.map(function(iconName, i) {
    //     const ws = fs.createWriteStream('.tmp/' + iconName.slice(0, -4) + '.png');
    //     ws.write(pngs[i]);
    // });
})
.then(function() {

}, function(err) {
	console.error(err.stack);
});