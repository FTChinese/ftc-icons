const promisify = require('promisify-node')
const fs = promisify('fs');
const path = require('path');
const co = require('co');
const isThere = require('is-there');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');
const svg2png = require('svg2png');
const chalk = require('chalk');
const iconNames = require('../icon-list.json');

const svgDir = path.resolve(process.cwd(), 'svg');
const pngDir = path.resolve(process.cwd(), 'static/png');

if (!isThere(pngDir)) {
	mkdirp.sync(pngDir);
}

iconNames.map((iconName) => {
	co(function *() {

		const iconPath = `${svgDir}/${iconName}.svg`;
		const dest = `${pngDir}/${iconName}.png`;

		try {
// svg2png only accepts raw buffer. Do not add `encoding` option for `readFile`.
			const svg = yield fs.readFile(iconPath);

			const pngBuffer = yield svg2png(svg);

			str(pngBuffer)
				.pipe(fs.createWriteStream(dest));

		} catch(e) {
			console.log(chalk.red('Error with file:'), chalk.red(iconName + '.svg'));
			console.error(e);
		}

		return dest;
	})
	.then(function(name) {
		console.log(`Converted to ${name}`);
	}, function(err) {
		console.error(err.stack);
	});
});
