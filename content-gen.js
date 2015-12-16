'use strict'
const fs = require('fs');
const Mustache = require('mustache');

let template = '{{#svg}}<li><i class="icon {{.}}"></i><span>{{.}}</span></li>{{/svg}}';
let imgTpl = '{{#svg}}<li><img src="../o-ft-icons/svg/{{.}}.svg" /></i><span>{{.}}</span></li>{{/svg}}';
let folder = 'o-ft-icons/svg';

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
	
	fs.writeFile('demo/partials/svg4bkg.html', output, function(err) {
		if (err) throw err;
		console.log('SVG List saved');
	});

	let imgOutput = Mustache.render(imgTpl, view);
	console.log(imgOutput);
	fs.writeFile('demo/partials/svg4img.html', imgOutput, function(err) {
		if (err) throw err;
		console.log('SVG as IMG source');
	});
});



