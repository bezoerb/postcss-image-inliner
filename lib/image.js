var debug = require('debug')('image-inliner');
var map = require('lodash.map');

var SVGO = require('svgo');
var svgo = new SVGO();
var Promise = require('bluebird');

function computeDataUri(file, key) {

    // if the url is SVG, let's compress and use the XML directly
    if (file.mime === 'image/svg+xml') {
        return new Promise(function (resolve, reject) {
            svgo.optimize(file.contents.toString(), function (result) {
                debug('optimising svg');
                if (result.error) {
                    debug('errored', result.error);
                    return reject(new Error(result.error));
                }
                var replacements = {
                    '<':  '%3C',
                    '>':  '%3E',
                    '"':  '%22',
                    '\'': '%27'
                };
                var body = result.data.replace(/["'<>]/g, function (m) {
                    return replacements[m];
                });
                resolve({
                    data: 'data:image/svg+xml;utf8,' + body,
                    key:  key
                });
            });
        });
    }

    // otherwise we base64 encode the image
    return {
        data: 'data:' + file.mime + ';base64,' + new Buffer(file.contents, 'binary').toString('base64'),
        key:  key
    };
}


function getDataUri(res) {
    var promises = map(res, computeDataUri);

    return Promise.reduce(promises, function (uris, resource) {
        uris[resource.key] = resource.data;
        return uris;
    }, {});

}


module.exports.getDataUri = getDataUri;
