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
const nunjucks = require('nunjucks');
const iconList = require('./icon-list.json');

const helper = require('./helper');

const svgDir = 'svg';
const pngDir = 'static/png';
const iconNames = Object.keys(iconList);

iconNames.map((iconName) => {
	co(function *() {
		const iconPath = `${svgDir}/${iconName}.svg`;

	  const svg = yield helper.readFile(iconPath);

	// svg2png only accepts raw buffer.
		svg2png(Buffer.from(svg))
	    .then(buffer => {

	// build png dest path
	      fs.writeFile(`${pngDir}/${iconName}.png`, buffer)
	    }, (e) => {
	      console.log(chalk.red('Error with file:'), chalk.red(iconName + '.svg'));
	      console.error(e);
	    });
		return iconName;
	})
	.then(function(name) {
		console.log(`Converting ${name}.svg to ${name}.png`);
	}, function(err) {
		console.error(err.stack);
	});
});
