var postcss = require('postcss');
var expect  = require('chai').expect;
var defaults = require('lodash.defaults');
var path = require('path');
var fs = require('fs');

var finalhandler = require('finalhandler');
var http = require('http');
var serveStatic = require('serve-static');

var plugin = require('../');

function read(filename) {
    return fs.readFileSync(path.join(__dirname, 'fixtures', 'styles', filename), 'utf8');
}

var test = function (input, output, opts, done) {
    input = read(input);
    output = read(output);

    opts = defaults(opts || {}, {
        assetPaths: ['//localhost:3000/styles/']
    });

    postcss([ plugin(opts) ]).process(input).then(function (result) {
        expect(result.css).to.eql(output);
        expect(result.warnings()).to.be.empty;
        done();
    }).catch(function (error) {
        done(error);
    });
};


function startServer(docroot) {
    var serve = serveStatic(docroot);
    var server = http.createServer(function (req, res) {
        var done = finalhandler(req, res);
        serve(req, res, done);
    });
    server.listen(3000);

    return server;
}


/* eslint max-len:0 */
describe('postcss-image-inliner', function () {
    var server;

    beforeEach(function () {
        server = startServer(path.join(__dirname, 'fixtures'));
    });
    afterEach(function (done) {
        server.close(done);
    });

    it('should skip too big images', function (done) {
        test('big.css', 'big.css', { maxFileSize: 1 }, done);
    });

    it('should handle multiple background images', function (done) {
        test('multi.in.css', 'multi.out.css', { }, done);
    });

    it('should handle background shorthand', function (done) {
        test('shorthand.in.css', 'shorthand.out.css', { }, done);
    });

    it('should handle media queries', function (done) {
        test('media.in.css', 'media.out.css', { }, done);
    });

    it('should consider base64Svg option', function (done) {
        test('b64svg.in.css', 'b64svg.out.css', { b64Svg: true, maxFileSize: 0 }, done);
    });

    it('should do nothing on missing files in non strict mode', function (done) {
        test('missing.in.css', 'missing.out.css', { }, done);
    });

    it('should handle content property in pseudo elements', function (done) {
        test('content.in.css', 'content.out.css', { }, done);
    });

    it('should fail on missing files in strict mode', function (done) {
        test('missing.in.css', 'missing.out.css', { strict: true }, function (error) {
            if (error) {
                done();
            } else {
                done(new Error('Should fail'));
            }
        });
    });
});
