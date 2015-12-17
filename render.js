'use strict'
const fs = require('fs');
const Mustache = require('mustache');

var folder = 'o-ft-icons/svg';
var source = 'demo/index.mustache';
var filenames = [];
var dest = '.tmp/index.html'

var p = new Promise(function(resolve, reject) {
	fs.readdir(folder, function(err, files) {
		if (err) throw err;
		filenames = files.map(function(filename) {
			return filename.slice(0, -4);
		});
		resolve(filenames);
	});
});

p.then(function(val) {
	fs.readFile(source, function(err, data) {
		if (err) throw err;
		let view = {
			svg: val
		};
		let template = data.toString();
		let output = Mustache.render(template, view);

		fs.writeFile(dest, output, function(err) {
			if (err) throw err;
			console.log('index.html generated.');
		});
	});	
})
.catch(function(reason) {
    console.log('Failed because: ' + reason);
  });
