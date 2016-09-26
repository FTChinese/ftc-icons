// usage -i arrow-down arrow-up -o arrow
const fs = require('fs');
const path = require('path');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');
const cheerio = require('cheerio');
const nunjucks = require('nunjucks');

const commandLineArgs = require('command-line-args');
const optionDefinitions = [
	{name: 'input', alias: 'i', type: String, multiple: true},
	{name: 'output', alias: 'o', type: String}
];

const argv = commandLineArgs(optionDefinitions);

const helper = require('./helper');
const iconList = argv.input;

const svgDir = path.resolve(process.cwd(), 'svg');
const dest = path.resolve(process.cwd(), 'sprite')

if (argv.input) {
	co(function *() {
		var output = '';

		if (argv.output) {
			output = `${argv.output}.svg`;
		} else {
			output = `${argv.input.join('_')}.svg`;
		}

	  if (!isThere(dest)) {
	    mkdirp(dest, (err) => {
	      if (err) console.log(err);
	    });
	  }

		const iconFiles = iconList.map(icon => path.resolve(svgDir, `${icon}.svg`));

		// readFile returns an object {path: file-path, content: file-content}
		const svgs = yield Promise.all(iconFiles.map(helper.readFile));
	  const svgData = svgs.map(extractSvg);

	  const sprite = nunjucks.renderString(spriteTemplate, {symbols: svgData})

	  str(sprite)
	  	.pipe(fs.createWriteStream(`${dest}/${output}`));
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
		id: path.basename(svg.path, '.svg'),
		width: width,
		height: height,
		content: content
	};
}

const spriteTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg">{% for symbol in symbols %}<symbol id="{{symbol.id}}" viewBox="0 0 {{symbol.width}} {{symbol.height}}">{{symbol.content | safe}}</symbol>{% endfor %}</svg>`;
