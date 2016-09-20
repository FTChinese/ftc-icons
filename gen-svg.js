const fs = require('fs');
const path = require('path');
const url = require('url');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');
const cheerio = require('cheerio');

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

    const renderedSvgs = yield Promise.all(iconNames.map(function(iconName) {
    	const context = iconList[iconName];

    	const template = iconName + '.svg';

    	return helper.render(template, context);
    }));

    iconNames.forEach(function(iconName, i) {
    	const iconObj = iconList[iconName];
    	var svgString = renderedSvgs[i];

    	if (iconObj && iconObj.hasOwnProperty('background')) {
    		$ = cheerio.load(svgString, {
    			xmlMode: true,	
  				decodeEntities: false
    		});
    		const rectEl = `<rect width="100%" height="100%" fill="${iconObj.background}"/>`;
    		$('svg').prepend(rectEl)
    		svgString = $.html();
    	}

		str(svgString)
		.pipe(fs.createWriteStream('svg/' + iconName + '.svg'));
    });

    // const svgs = yield Promise.all(iconList.map(function(iconName) {
    // 	return helper.readFile('views/' + iconName);
    // }));

    // svgs.forEach(function(svg, i) {
    // 	$ = cheerio.load(svg, {
    // 		xmlMode: true,	
  		// 	decodeEntities: false
    // 	});
    // 	const background = $('rect').attr('fill');
    // 	const foreground = $('path').attr('fill');
    // 	const key = iconList[i].slice(0, -4);
    	

    // 	if (background || foreground) {
    // 		meta[key] = {};
    // 		if (background) {
    // 			meta[key].background = background;
    // 		}
    // 		if (foreground) {
	   //  		meta[key].foreground = foreground
	   //  	}
    // 	} else {
    // 		meta[key] = null;
    // 	}
    	
    // });
    // console.log(meta);

    // str(JSON.stringify(meta, null, 4))
    // 	.pipe(fs.createWriteStream('.tmp/meta.json'));
})
.then(function() {

}, function(err) {
	console.error(err.stack);
});