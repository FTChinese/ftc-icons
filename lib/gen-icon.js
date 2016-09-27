// usage: -i=icon-name -c=color
const promisify = require('promisify-node');
const fs = promisify('fs');
const path = require('path');
const url = require('url');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');
const cheerio = require('cheerio');
const svg2png = require('svg2png');
const chalk = require('chalk');
const helper = require('./helper');

const minimist = require('minimist');
const options = {
	string: ['input', 'color'],
	alias: {
		i: 'input',
		c: 'color'
	}
}
const argv = minimist(process.argv.slice(2), options);

console.log(argv);

const dest = path.resolve(process.cwd(), '.tmp');

if (!isThere(dest)) {
  mkdirp(dest, (err) => {
    if (err) console.log(err);
  });
}

if (argv.i) {
	const iconName = argv.i;
	const iconPath = `svg/${iconName}.svg`;

	fs.readFile(iconPath)
		.then(function(svg) {
			if (argv.c) {
				return transformSvg(svg, argv.c)
			} else {
				return svg
			}
		})
		.then(function(result) {
			str(result)
			.pipe(fs.createWriteStream(`${dest}/${iconName}.svg`))
			.on('error', (e) => {
				console.error(e);
			});
			return Buffer.from(result);
		})
		.then(svg2png)
		.then(buffer => {
	      	console.log(`Converting ${argv.i}.svg to ${argv.i}.png`);

	        fs.writeFile(`${dest}/${argv.i}.png`, buffer)
	    }, (e) => {
	        console.log(chalk.red('Error with file:'), chalk.red(argv.i + '.svg'));
	        console.error(e);
	    });
} else {
	console.log('You should provide an icon name. (No extension).')
}

function transformSvg(svg, color) {
  $ = cheerio.load(svg, {
    xmlMode: true,
    decodeEntities: false
  });
	$('path').attr('fill', color)
  return $.html();
}
