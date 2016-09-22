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

const svgDir = 'static/svg';
const spriteDir = 'static/sprite';
const partialsDir = 'partials'

co(function *() {
	var iconNames;
	var iconPaths;
	var destSprite;

    if (!isThere(spriteDir)) {
      mkdirp(spriteDir, (err) => {
        if (err) console.log(err);
      });
    }

// prepare variables needed.
    if (argv.input) {
// iconNames have no extension
    	iconNames = argv.input;
    	iconPaths = iconNames.map(iconName => {
    		return buildPath(iconName, svgDir)
    	});
    } else {
    	iconPaths = yield helper.readDir(svgDir);
// iconNames hav extension .svg
 		iconNames = iconPaths.map(iconPath => path.basename(iconPath, '.svg')); 
    }

	if (argv.output) {
		destSprite = buildPath(argv.output, spriteDir);
	} else {
		destSprite = argv.input ? buildPath(argv.input.join('_'), spriteDir) : buildPath('all', spriteDir);
	}

// always extract data from svg.
	const iconData = yield Promise.all(iconPaths.map(extractSvg));

// if no icon name specified, generate individual symbol file.
	if (!argv.input) {		
// render each symbols
		const symbols = iconData.map(data => symbolTemplate(data, 'o-icons'));

// write each symbols to file
		symbols.forEach((symbol, i) => {
			const iconName = iconNames[i];

			console.log(`Generating SVG symbol file: ${iconName}`);

			str(symbol)
				.pipe(fs.createWriteStream(buildPath(iconName, partialsDir)))
				.on('error', function(e) {
					throw e;
				});
		}); 			
	}

// whether argv exists or not, you need to output sprite.
// render each symbol again for sprite, which does not need `prefix`
	const spriteSymbols = iconData.map(data => symbolTemplate(data));

    const spriteString = spriteTemplate(spriteSymbols.join(''));

    console.log(`Generating sprite file ${destSprite}`)
    str(spriteString)
    	.pipe(fs.createWriteStream(destSprite));
})
.then(function() {

}, function(err) {
	console.error(err.stack);
});

function buildPath(filename, dir) {
	if (!dir) {
		dir = '.';
	}
	return `${dir}/${filename}.svg`;
}

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