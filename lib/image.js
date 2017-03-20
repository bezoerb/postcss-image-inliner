'use strict';
const debug = require('debug')('image-inliner');
const map = require('lodash.map');
const SVGO = require('svgo');
const Bluebird = require('bluebird');

const svgo = new SVGO();

// Borrowed from https://github.com/filamentgroup/directory-encoder/blob/master/lib/svg-uri-encoder.js
function encodeSvg(file) {
    return encodeURIComponent(file.contents.toString('utf-8')
        // Strip newlines and tabs
        .replace(/[\n\r]/gmi, '')
        .replace(/\t/gmi, ' ')
        // Strip comments
        .replace(/<!--(.*(?=-->))-->/gmi, '')
        // Replace
        .replace(/'/gmi, '\\i'))
        // Encode brackets
        .replace(/\(/g, '%28').replace(/\)/g, '%29')
        // Replace ' with "
        .replace(/'/gm, '"');
}

function computeDataUri(opts) {
    return function (file, key) {
        // If the url is SVG, let's compress and use the XML directly
        if (file.mime === 'image/svg+xml' && !opts.b64Svg) {
            return new Bluebird((resolve, reject) => {
                svgo.optimize(file.contents.toString('utf-8'), result => {
                    debug('optimising svg');
                    if (result.error) {
                        debug('errored', result.error);
                        return reject(new Error(result.error));
                    }

                    resolve({
                        data: 'data:image/svg+xml;charset=US-ASCII,' + encodeSvg(file),
                        key
                    });
                });
            });
        }

        // Otherwise we base64 encode the image
        return {
            data: 'data:' + file.mime + ';base64,' + Buffer.from(file.contents, 'binary').toString('base64'),
            key
        };
    };
}

function getDataUri(res, opts) {
    const promises = map(res, computeDataUri(opts));

    return Bluebird.reduce(promises, (uris, resource) => {
        uris[resource.key] = resource.data;
        return uris;
    }, {});
}

module.exports.getDataUri = getDataUri;
