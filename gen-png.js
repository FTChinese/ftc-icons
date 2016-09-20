const fs = require('fs');
const path = require('path');
const url = require('url');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');
const svg2png = require('svg2png');

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
    const iconPath = iconNames.map(function(iconName) {
        return path.resolve('svg', iconName)
    });

    const svgs = yield Promise.all(iconPath.map(helper.readFile));
    const pngs = yield Promise.all(svgs.map(svg2png));
    iconNames.map(function(iconName, i) {
        const ws = fs.createWriteStream('.tmp/' + iconName.slice(0, -4) + '.png');
        ws.write(pngs[i]);
    });
})
.then(function() {

}, function(err) {
	console.error(err.stack);
});