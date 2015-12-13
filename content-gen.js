'use strict'
const fs = require('fs');
const Mustache = require('mustache');

let template = '{{#svg}}<li><i class="icon {{.}}"></i><span>{{.}}</span></li>{{/svg}}';
let folder = 'svg';

fs.readdir(folder, function(err, files) {
	let filenames = [];

	if (err) {
		throw err;
	}
	filenames = files.map(function(filename) {
		return filename.slice(0, -4);
	});

	console.log(filenames);
	let view = {
		svg: filenames
	}
	let output = Mustache.render(template, view);
	console.log(output);
	fs.writeFile('svglist.html', output, function(err) {
		if (err) throw err;
		console.log('SVG List saved');
	});
});

