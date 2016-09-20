const fs = require('fs');
const junk = require('junk')
const nunjucks = require('nunjucks');

var env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(
    ['templates'], 
    {noCache: true}
  ),
  {autoescape: false}
);

function render(name, context) {
  const obj = {};
  return new Promise(function(resolve, reject) {
    env.render(name, context, function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function readJson(filename) {
  return new Promise(
    function(resolve, reject) {
      fs.readFile(filename, 'utf8', function(err, data) {
        if (err) {
          console.log('Cannot find file: ' + filename);
          reject(err);
        } else {
          resolve(JSON.parse(data));
        }
      });
    }
  );
}

function readFile(filename) {
  return new Promise(
    function(resolve, reject) {
      fs.readFile(filename, 'utf8', function(err, data) {
        if (err) {
          console.log('Cannot find file: ' + filename);
          reject(err);
        } else {
          resolve(data);
        }
      });
    }
  );
}

function readDir(path) {
  return new Promise(function(resolve, reject) {
    fs.readdir(path, 'utf8', function(err, files) {
      if (err) {
        reject(err);
      } else {
        resolve(files.filter(junk.not));
      }
    });
  });
}

module.exports = {
  readJson: readJson,
  readFile: readFile,
  readDir: readDir,
  render: render
};