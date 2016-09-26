const fs = require('fs');
const path = require('path');
const url = require('url');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');
const cheerio = require('cheerio');

const helper = require('./helper');
const iconList = require('./icon-list.json');

const svgDir = 'svg';
const spriteDir = 'static/sprite';
const partialsDir = 'partials'

co(function *() {

  if (!isThere(spriteDir)) {
    mkdirp(spriteDir, (err) => {
      if (err) console.log(err);
    });
  }

	const iconFiles = iconList.map(icon => path.join(svgDir, `${icon}.svg`));

// readFile returns an object {path: file-path, content: file-content}
	const svgs = yield Promise.all(iconFiles.map(helper.readFile));
  const svgData = svgs.map(extractSvg);

// render each symbols
	const symbols = svgData.map((data) => symbolTemplate(data, 'o-icons'));

// write each symbols to file
	symbols.forEach((symbol) => {
		const basename = path.basename(symbol.path);
		str(symbol.content)
			.pipe(fs.createWriteStream(`${partialsDir}/${basename}`))
			.on('error', function(e) {
				throw e;
			});
	});

	const spriteSymbols = svgData.map(data => symbolTemplate(data));

  const spriteString = spriteTemplate(spriteSymbols.map(symbol => {
    return symbol.content;
  }).join(''));

  str(spriteString)
  	.pipe(fs.createWriteStream(`${spriteDir}/all.svg`));
})
.then(function() {

}, function(err) {
	console.error(err.stack);
});


function extractSvg(svg) {
	$ = cheerio.load(svg.content, {
		xmlMode: true,
		decodeEntities: false
	});
	const width = $('svg').attr('width');
	const height = $('svg').attr('height');
	$('rect').remove();
// remove any color on path
	$('path').removeAttr('fill');
	const content = $('svg').html();
	return {
    path: svg.path,
		width: width,
		height: height,
		content: content
	};
}

function symbolTemplate(data, prefix) {
	var id = null;
  var name = path.basename(data.path, '.svg');
	if (prefix) {
		name = `${prefix}__${name}`;
	}

  return {
    path: data.path,
    content: `<symbol id="${name}" viewBox="0 0 ${data.width} ${data.height}">${data.content}</symbol>`
  }
}

function spriteTemplate(content) {
	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}
