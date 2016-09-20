const fs = require('fs');
const path = require('path');
const url = require('url');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');
const svg2png = require('svg2png');

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

    
})
.then(function() {

}, function(err) {
	console.error(err.stack);
});