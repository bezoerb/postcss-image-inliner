/**
 * Created by ben on 17.09.15.
 */
var fs = require('fs');
var url = require('url');
var request = require('request');
var mime = require('mime');
var Promise = require('bluebird');
var path = require('path');
var debug = require('debug')('image-inliner');
var result = require('lodash.result');
var cache = {};

Promise.promisifyAll(fs);

/**
 * Get external resource
 * @param {string} uri
 * @returns {Promise}
 */
function requestAsync(resource) {
    var settings = {
        followRedirect: true,
        encoding:       'binary'
    };
    return new Promise(function (resolve, reject) {
        // handle protocol-relative urls
        resource = url.resolve('http://te.st', resource);
        request(resource, settings, function (err, resp, body) {
            if (err) {
                return reject(err);
            }
            if (resp.statusCode !== 200) {
                return reject('Wrong status code ' + resp.statusCode + ' for ' + url);
            }
            resolve({
                contents: body,
                path:     resource,
                mime:     result(resp, 'headers.content-type') || mime.lookup(resource)
            });
        });
    });
}

function isUrl(resource) {
    return /(^\/\/)|(:\/\/)/.test(resource);
}


function readAsync(resource) {
    return fs.readFileAsync(resource).then(function (body) {
        return {
            contents: body,
            path:     resource,
            mime:     mime.lookup(resource)
        };
    });
}

function join(base, file) {
    if (isUrl(file)) {
        return file;
    }
    if (isUrl(base)) {
        return url.resolve(base, file);
    }

    return path.join(base, file);
}

function getResource(base, file) {
    var resource = join(base, file);

    if (cache[resource]) {
        debug('deliver from cache:', resource, cache[resource]);
        return cache[resource];
    }

    if (isUrl(resource)) {
        cache[resource] = requestAsync(resource);
    } else {
        cache[resource] = readAsync(resource);
    }

    return cache[resource];
}


module.exports.getResource = getResource;
