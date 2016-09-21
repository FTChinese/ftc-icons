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

function extract(svg) {
	$ = cheerio.load(svg, {
		xmlMode: true,	
		decodeEntities: false
	});
	const width = $('svg').attr('width');
	const height = $('svg').attr('height');
	$('rect').remove();
	$('path').removeAttr('fill');
	const content = $('svg').html();
	return {
		width: width,
		height: height,
		content: content
	};
}

function extractSvg(file) {
	return new Promise(function(resolve, reject) {
		fs.readFile(file, 'utf8', function(err, data) {
			if (err) {
				reject(err)
			} else {
				const extractedData = extract(data);
				resolve(Object.assign(extractedData, {
					iconName: path.basename(file, '.svg')
				}));
			}
		});
	});
}

function symbolTemplate(data, prefix) {
	var id = null;
	if (prefix) {
		id = `${prefix}__${data.iconName}`;
	} else {
		id = data.iconName;
	}

	return `<symbol id="${id}" viewBox="0 0 ${data.width} ${data.height}">${data.content}</symbol>`;
}

function spriteTemplate(content) {
	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

co(function *() {
	const destDir = 'symbol';
	var iconNames;
	var iconPaths;
	var destSprite;

    if (!isThere(destDir)) {
      mkdirp(destDir, (err) => {
        if (err) console.log(err);
      });
    }

// prepare variables needed.
    if (argv.input) {
// iconNames have no extension
    	iconNames = argv.input;
    	iconPaths = iconNames.map(iconName => path.join('svg', `${iconName}.svg`));
    } else {
    	iconPaths = yield helper.readDir('svg');
// iconNames hav extension .svg
 		iconNames = iconPaths.map(iconPath => path.basename(iconPath)); 
    }

	if (argv.output) {
		destSprite = `sprite/${argv.output}`
	} else {
		destSprite = argv.input ? `sprite/${argv.input.join('_')}.svg` : 'sprite/all.svg';
	}

// always extract data from svg.
	const iconData = yield Promise.all(iconPaths.map(extractSvg));

// if no icon name specified, generate individual symbol file.
	if (!argv.input) {		
// render each symbols
		const symbols = iconData.map(data => symbolTemplate(data, 'o-icons'));

// write each symbols to file
		symbols.forEach((symbol, i) => {
			console.log(`Generating SVG symbol file: ${iconNames[i]}`);

			str(symbol)
				.pipe(fs.createWriteStream(`symbol/${iconNames[i]}`))
				.on('error', function(e) {
					throw e;
				});
		}); 			
	}

// whether argv exists or not, you need to output sprite.
// render each symbol again for sprite, which does not need `prefix`
	const spriteSymbols = iconData.map(data => symbolTemplate(data));

    const spriteString = spriteTemplate(spriteSymbols.join(''));

    const destPath = `sprite/${argv.output}.svg`
    console.log(`Generating sprite file ${destSprite}`)
    str(spriteString)
    	.pipe(fs.createWriteStream(destSprite));
})
.then(function() {

}, function(err) {
	console.error(err.stack);
});