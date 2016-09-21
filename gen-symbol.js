const fs = require('fs');
const path = require('path');
const url = require('url');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');
const cheerio = require('cheerio');

const helper = require('./helper');

function buildData(svg) {
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

co(function *() {
	const destDir = 'symbol';

    if (!isThere(destDir)) {
      mkdirp(destDir, (err) => {
        if (err) console.log(err);
      });
    }

    const iconNames = yield helper.readDir('svg');

    const iconPath = iconNames.map(function(iconName) {
        return path.resolve('svg', iconName)
    });

    const svgs = yield Promise.all(iconPath.map(helper.readFile));
    
    const results = yield Promise.all(svgs.map(function(svg, i) {
    	const context = Object.assign(buildData(svg), {
    		name: 'o-icons__' + iconNames[i].slice(0, -4)
    	});

		return helper.render('symbol.html', context);
    }));

    results.forEach((result, i) => {
    	str(result)
    	.pipe(fs.createWriteStream('symbol/' + iconNames[i]));
    });

    const sprite = yield helper.render('sprite.html', {
    	symbols: results.map((result) => {
    		return result.replace('o-icons__', '');
    	})
    });
    
    str(sprite)
    .pipe(fs.createWriteStream('sprite/all.svg'));
})
.then(function() {

}, function(err) {
	console.error(err.stack);
});