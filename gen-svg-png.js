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

// generate svgs from templates in `views` with `icon-list` as template context.
co(function *() {
	const destDir = '.tmp';

    if (!isThere(destDir)) {
      mkdirp(destDir, (err) => {
        if (err) console.log(err);
      });
    }

    const iconNames = Object.keys(iconList);

    const svgs = yield Promise.all(iconNames.map((iconName) => {
			const iconPath = `${svgDir}/${iconName}.svg`;
			return helper.readFile(iconPath);
		}));

    iconNames.forEach(function(iconName, i) {
    	var svg = svgs[i];
// svg2png only accepts raw buffer.
			svg2png(Buffer.from(svg))
	      .then(buffer => {
	      	console.log(`Converting ${iconName}.svg to ${iconName}.png`);
// build png dest path
	        fs.writeFile(`${pngDir}/${iconName}.png`, buffer)
	      }, (e) => {
	        console.log(chalk.red('Error with file:'), chalk.red(iconName + '.svg'));
	        console.error(e);
	      });
  });
})
.then(function() {

}, function(err) {
	console.error(err.stack);
});

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
