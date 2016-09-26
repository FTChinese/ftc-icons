const fs = require('fs');
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
const nunjucks = require('nunjucks');
const iconList = require('./icon-list.json');

const minimist = require('minimist');
const options = {
	string: ['input', 'background', 'foreground', 'rx', 'ry'],
	alias: {
		i: 'input',
		b: 'background',
		f: 'foreground',
		x: 'rx',
		y: 'ry'
	}
}
const argv = minimist(process.argv.slice(2), options);

console.log(argv);

const destDir = '.tmp';

if (!isThere(destDir)) {
  mkdirp(destDir, (err) => {
    if (err) console.log(err);
  });
}

if (argv.i) {
	const iconName = argv.i;
// default icon setting.
	const iconObj = iconList[iconName];
	const iconPath = `templates/${iconName}.svg`;
	const context = Object.assign(iconObj, argv);
	console.log(context);

	helper.readFile(iconPath)
		.then(function(content) {
			return nunjucks.renderString(content, context);
		})
		.then(function(string) {
			return transformSvg(string, context);
		})
		.then(function(result) {
			str(result)
			.pipe(fs.createWriteStream(`.tmp/${argv.i}.svg`))
			.on('error', (e) => {
				console.error(e);
			});
			return Buffer.from(result);
		})
		.then(svg2png)
		.then(buffer => {
	      	console.log(`Converting ${argv.i}.svg to ${argv.i}.png`);

	        fs.writeFile(`.tmp/${argv.i}.png`, buffer)
	    }, (e) => {
	        console.log(chalk.red('Error with file:'), chalk.red(argv.i + '.svg'));
	        console.error(e);
	    });
} else {
	console.log('You should provide an icon name. (No extension).')
}

function svgRect(data) {
	const rectEl = '<rect width="100%" height="100%" fill="{{background}}"{% if rx %} rx="{{rx}}"{% endif %}{% if ry %} ry="{{ry}}"{% endif %}/>';
	return nunjucks.renderString(rectEl, data)
}

function transformSvg(svg, data) {
  $ = cheerio.load(svg, {
    xmlMode: true,  
    decodeEntities: false
  });
  const rectEl = svgRect(data);
  
  $('svg').prepend(rectEl)
  return $.html();
}