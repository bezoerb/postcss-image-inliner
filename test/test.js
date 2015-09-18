var postcss = require('postcss');
var expect  = require('chai').expect;
var defaults = require('lodash.defaults');

var finalhandler = require('finalhandler');
var http = require('http');
var serveStatic = require('serve-static');

var plugin = require('../');

var test = function (input, output, opts, done) {
    postcss([ plugin(opts) ]).process(input).then(function (result) {
        expect(result.css).to.eql(output);
        expect(result.warnings()).to.be.empty;
        done();
    }).catch(function (error) {
        done(error);
    });
};


function startServer(docroot, opts) {
    opts = defaults(opts, {
        index: ['index.html', 'index.htm']
    });

    var serve = serveStatic(docroot, opts);
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
        server = startServer('test');
    });
    afterEach(function (done) {
        server.close(done);
    });

    it('should skip to big images', function (done) {
        test('.foo { background-image: url(test/images/blank.gif); }',
            '.foo { background-image: url(test/images/blank.gif); }', { maxFileSize: 1 }, done);
    });

    it('should inline images as data URIs', function (done) {
        test('.foo { background-image: url(test/images/blank.gif); }',
            '.foo { background-image: url(\'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==\'); }', {}, done);
    });
    it('should inline external images', function (done) {
        test('.foo { background-image: url(//localhost:3000/images/blank.gif); }',
            '.foo { background-image: url(\'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==\'); }', {}, done);
    });
    it('should inline external images from base paths', function (done) {
        var opts = {
            assetPaths: ['//localhost:3000/css/']
        };
        test('.foo { background-image: url(../images/blank.gif); }',
            '.foo { background-image: url(\'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==\'); }', opts, done);
    });

    it('should inline images as data URIs', function (done) {
        test('.foo { background-image: url(test/images/check.svg); }',
            '.foo { background-image: url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="19.213" height="18.295" version="1"><path d="M4.775 18.295c-.275-.004-1.462-1.778-2.638-3.944L0 10.414l.554-.554c.305-.306 1.124-.555 1.82-.555H3.64l.636 2.005.637 2.005 5.064-5.54c2.786-3.05 6.003-6.045 7.15-6.66L19.213 0l-4.21 4.782c-2.314 2.63-5.45 6.748-6.97 9.15-1.516 2.404-2.983 4.367-3.258 4.363z"/></svg>\'); }', {}, done);
    });
    it('should inline external images', function (done) {
        test('.foo { background-image: url(//localhost:3000/images/check.svg); }',
            '.foo { background-image: url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="19.213" height="18.295" version="1"><path d="M4.775 18.295c-.275-.004-1.462-1.778-2.638-3.944L0 10.414l.554-.554c.305-.306 1.124-.555 1.82-.555H3.64l.636 2.005.637 2.005 5.064-5.54c2.786-3.05 6.003-6.045 7.15-6.66L19.213 0l-4.21 4.782c-2.314 2.63-5.45 6.748-6.97 9.15-1.516 2.404-2.983 4.367-3.258 4.363z"/></svg>\'); }', {}, done);
    });
    it('should inline external images from base paths', function (done) {
        var opts = {
            assetPaths: ['//localhost:3000/css/']
        };
        test('.foo { background-image: url(../images/check.svg); }',
            '.foo { background-image: url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="19.213" height="18.295" version="1"><path d="M4.775 18.295c-.275-.004-1.462-1.778-2.638-3.944L0 10.414l.554-.554c.305-.306 1.124-.555 1.82-.555H3.64l.636 2.005.637 2.005 5.064-5.54c2.786-3.05 6.003-6.045 7.15-6.66L19.213 0l-4.21 4.782c-2.314 2.63-5.45 6.748-6.97 9.15-1.516 2.404-2.983 4.367-3.258 4.363z"/></svg>\'); }', opts, done);
    });

});
