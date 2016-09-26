// convert a svg into a svg's symbol element so that it could be included in html template.
const fs = require('fs');
const path = require('path');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');
const cheerio = require('cheerio');

const helper = require('./helper');
const iconList = require('../icon-list.json');

const svgDir = path.resolve(process.cwd(), 'svg');
const partialsDir = path.resolve(process.cwd(), 'partials');

co(function *() {

  if (!isThere(partialsDir)) {
    mkdirp(partialsDir, (err) => {
      if (err) console.log(err);
    });
  }

	const iconFiles = iconList.map(icon => path.resolve(svgDir, `${icon}.svg`));

// readFile returns an object {path: file-path, content: file-content}
	const svgs = yield Promise.all(iconFiles.map(helper.readFile));
  const svgData = svgs.map(extractSvg);

// render each symbols
	const symbols = svgData.map((data) => symbolTemplate(data, 'o-icons'));

// write each symbols to file
	symbols.forEach((symbol) => {
		const basename = path.basename(symbol.path);
		str(symbol.content)
			.pipe(fs.createWriteStream(path.resolve(partialsDir, `${basename}`)))
			.on('error', function(e) {
				throw e;
			});
	});
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
