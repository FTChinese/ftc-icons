const fs = require('fs');
const path = require('path');
const url = require('url');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');
const cheerio = require('cheerio');

const commandLineArgs = require('command-line-args');
const optionDefinitions = [
	{name: 'input', alias: 'i', type: String, multiple: true},
	{name: 'output', alias: 'o', type: String}
];

const argv = commandLineArgs(optionDefinitions);

const helper = require('./helper');
const iconList = argv.input;

const svgDir = 'svg';
const spriteDir = 'static/sprite';

if (argv.input) {
	co(function *() {
		var dest = '';

		if (argv.output) {
			dest = `${spriteDir}/${argv.output}.svg`;
		} else {
			dest = `${spriteDir}/${argv.input.join('_')}.svg`;
		}

	  if (!isThere(spriteDir)) {
	    mkdirp(spriteDir, (err) => {
	      if (err) console.log(err);
	    });
	  }

		const iconFiles = iconList.map(icon => path.join(svgDir, `${icon}.svg`));

		// readFile returns an object {path: file-path, content: file-content}
		const svgs = yield Promise.all(iconFiles.map(helper.readFile));
	  const svgData = svgs.map(extractSvg);

	// whether argv exists or not, you need to output sprite.
	// render each symbol again for sprite, which does not need `prefix`
		const spriteSymbols = svgData.map(data => symbolTemplate(data));

	  const spriteString = spriteTemplate(spriteSymbols.map(symbol => {
	    return symbol.content;
	  }).join(''));

	  str(spriteString)
	  	.pipe(fs.createWriteStream(dest));
	})
	.then(function() {

	}, function(err) {
		console.error(err.stack);
	});
} else {
	console.log('Please specify the icon names');
}

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
