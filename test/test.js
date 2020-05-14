/* eslint-env mocha */

'use strict';

const path = require('path');
const fs = require('fs');
const http = require('http');
const postcss = require('postcss');
const {assert} = require('chai');
const finalhandler = require('finalhandler');
const serveStatic = require('serve-static');

const plugin = require('..');

function read(filename) {
  return fs.readFileSync(path.join(__dirname, 'fixtures/styles', filename), 'utf8');
}

const test = (input, output, options_ = {}, done) => {
  input = read(input);
  output = read(output);

  const options = {assetPaths: ['//localhost:3000/styles/'], ...options_};

  postcss([plugin(options)])
    .process(input, {from: undefined})
    .then((result) => {
      assert.equal(result.css, output);
      assert.isEmpty(result.warnings());
    })
    .then(done)
    .catch((error) => {
      done(error);
    });
};

function startServer(docroot) {
  const serve = serveStatic(docroot);
  const server = http.createServer((request, response) => {
    const done = finalhandler(request, response);
    serve(request, response, done);
  });
  server.listen(3000);

  return server;
}

describe('postcss-image-inliner', () => {
  let server;

  beforeEach(() => {
    server = startServer(path.join(__dirname, 'fixtures'));
  });
  afterEach((done) => {
    server.close(done);
  });

  it('should skip too big images', (done) => {
    test('big.css', 'big.css', {maxFileSize: 1}, done);
  });

  it('should handle multiple background images', (done) => {
    test('multi.in.css', 'multi.out.css', {}, done);
  });

  it('should handle background shorthand', (done) => {
    test('shorthand.in.css', 'shorthand.out.css', {}, done);
  });

  it('should handle media queries', (done) => {
    test('media.in.css', 'media.out.css', {}, done);
  });

  it('should consider base64Svg option', (done) => {
    test('b64svg.in.css', 'b64svg.out.css', {b64Svg: true, maxFileSize: 0}, done);
  });

  it('should do nothing on missing files in non strict mode', (done) => {
    test('missing.in.css', 'missing.out.css', {}, done);
  });

  it('should handle urls used for content property', (done) => {
    test('pseudo.in.css', 'pseudo.out.css', {}, done);
  });

  it('should fail on missing files in strict mode', (done) => {
    test('missing.in.css', 'missing.out.css', {strict: true}, (error) => {
      if (error) {
        done();
      } else {
        done(new Error('Should fail'));
      }
    });
  });

  it('should allow globbing', (done) => {
    test('glob.in.css', 'glob.out.css', {assetPaths: 'test/*/images/'}, done);
  });
});
