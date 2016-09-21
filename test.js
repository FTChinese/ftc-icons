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
	},
	default: {
		input: 'social-wechat',
		background: '#fff',
		foreground: '#000',
		rx: '50%',
		ry: '50%'
	}
}
const argv = minimist(process.argv.slice(2), options);

const context = {
	background: argv.b,
	foreground: argv.f,
	rx: argv.x,
	ry: argv.y
};

if (argv.i) {
	const iconName = argv.i;
	const iconPath = `templates/${iconName}.svg`;

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
}

function transformSvg(svg, data) {
  $ = cheerio.load(svg, {
    xmlMode: true,  
    decodeEntities: false
  });
  var styles = `fill="${data.background}"`;
  if (data.rx && data.ry) {
    styles += `rx="${data.rx}" ry="${data.ry}"`;
  }
  const rectEl = `<rect width="100%" height="100%" ${styles}/>`;
  
  $('svg').prepend(rectEl)
  return $.html();
}