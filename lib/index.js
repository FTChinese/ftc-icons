const fs = require('fs-jetpack');
const path = require('path');
const cheerio = require('cheerio');
const filterFiles = require('./filter-files.js');
const svgDir = path.resolve(process.cwd(), 'fticons/svg');

async function convertToSymbol(source, destDir) {
	try {
		const id = path.basename(source, '.svg');
		const svgOutput = `${destDir}/${path.basename(source)}`;

		const svgStr = await fs.readAsync(source);
		$ = cheerio.load(svgStr, {
			xmlMode: true,
			decodeEntities: false
		});
		const viewBox = $('svg').attr('viewBox');
		const pathEl = $.html('path');
		const symbol = `<symbol id="o-icons__${id}" viewBox="${viewBox}">${pathEl}</symbol>`;
		console.log(`Saving ${svgOutput}`);
		await fs.writeAsync(svgOutput, symbol);
	} catch (e) {
		throw e;
	}
}

async function icons(destDir='views/icons') {
	const dest = path.resolve(process.cwd(), destDir);

	const filenames = await fs.listAsync(svgDir);
	const svgs = filterFiles(filenames);
	
	await Promise.all(svgs.map(svg => {
		const filePath = `${svgDir}/${svg}`;
		console.log(`Converting ${filePath}`)
		return convertToSymbol(filePath, dest);
	}));
}

if (require.main === module) {
	icons('partials')
		.catch(err => {
			console.log(err);
		});
}

module.exports = icons;