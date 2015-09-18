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

    it('should inline images as data URIs', function (done) {
        test('.foo { background-image: url(test/images/blank.gif); }',
            '.foo { background-image: url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==); }', {}, done);
    });
    it('should inline external images', function (done) {
        test('.foo { background-image: url(//localhost:3000/images/blank.gif); }',
            '.foo { background-image: url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==); }', {}, done);
    });
    it('should inline external images from base paths', function (done) {
        var opts = {
            assetPaths: ['//localhost:3000/css/']
        };
        test('.foo { background-image: url(../images/blank.gif); }',
            '.foo { background-image: url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==); }', opts, done);
    });

});
