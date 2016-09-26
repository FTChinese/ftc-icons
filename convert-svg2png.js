const promisify = require('promisify-node')
const fs = promisify('fs');
const path = require('path');
const co = require('co');
const isThere = require('is-there');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');
const svg2png = require('svg2png');
const chalk = require('chalk');
const iconList = require('./icon-list.json');

const helper = require('./helper');

const svgDir = 'svg';
const pngDir = 'static/png';
const iconNames = Object.keys(iconList);

if (!isThere(pngDir)) {
	mkdirp.sync(pngDir);
}

iconNames.map((iconName) => {
	co(function *() {

		const iconPath = `${svgDir}/${iconName}.svg`;

		try {
// svg2png only accepts raw buffer. Do not add `encoding` option for `readFile`.
			const svg = yield fs.readFile(iconPath);

			const pngBuffer = yield svg2png(svg);
			str(pngBuffer)
				.pipe(fs.createWriteStream(`${pngDir}/${iconName}.png`));

		} catch(e) {
			console.log(chalk.red('Error with file:'), chalk.red(iconName + '.svg'));
			console.error(e);
		}

		return iconName;
	})
	.then(function(name) {
		console.log(`Converted ${name}.svg to ${name}.png`);
	}, function(err) {
		console.error(err.stack);
	});
});
