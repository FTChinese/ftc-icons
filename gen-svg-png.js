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

// generate svgs from templates in `views` with `icon-list` as template context.
co(function *() {
	const destDir = '.tmp';
	const meta = {};

    if (!isThere(destDir)) {
      mkdirp(destDir, (err) => {
        if (err) console.log(err);
      });
    }

    const iconList = yield helper.readJson('icon-list.json');

    const iconNames = Object.keys(iconList);

    const svgs = yield Promise.all(iconNames.map(function(iconName) {
    	const context = iconList[iconName];

    	const template = iconName + '.svg';

    	return helper.render(template, context);
    }));

    iconNames.forEach(function(iconName, i) {
    	const iconObj = iconList[iconName];
    	var svg = svgs[i];

    	if (iconObj && iconObj.hasOwnProperty('background')) {
    		svg = transformSvg(svg, iconObj);
    	}

    console.log(`Generating ${iconName}.svg`);

		str(svg)
			.pipe(fs.createWriteStream(`svg/${iconName}.svg`))
			.on('error', (e) => {
				console.error(e);
			});
			
// svg2png only accepts raw buffer.
		svg2png(Buffer.from(svg))
      .then(buffer => {
      	console.log(`Converting ${iconName}.svg to ${iconName}.png`);

        fs.writeFile(`.tmp/${iconName}.png`, buffer)
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