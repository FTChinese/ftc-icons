const fs = require('fs');
const path = require('path');
const junk = require('junk')
const nunjucks = require('nunjucks');

var env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(
    [process.cwd(), path.resolve(process.cwd(), 'demos/src')],
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
          resolve({
            path: filename,
            content: data
          });
        }
      });
    }
  );
}

function readDir(filepath) {
  return new Promise(function(resolve, reject) {
    fs.readdir(filepath, 'utf8', function(err, files) {
      if (err) {
        reject(err);
      } else {
        resolve(files.filter(junk.not).map(file => path.join(filepath, file)));
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
