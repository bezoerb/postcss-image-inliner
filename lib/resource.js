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
var filesize = require('filesize');
var hash = require('object-hash');
var cache = {};

Promise.promisifyAll(fs);

function getSize(string) {
    return Buffer.byteLength(string, 'utf8');
}

/**
 * Get external resource
 * @param {string} uri
 * @returns {Promise}
 */
function requestAsync(resource, opts) {
    var maxFileSize = result(opts, 'maxFileSize');
    var settings = {
        followRedirect: true,
        encoding:       'binary'
    };
    return new Promise(function (resolve, reject) {
        // handle protocol-relative urls
        resource = url.resolve('http://te.st', resource);
        request(resource, settings, function (err, resp, body) {
            var msg;
            if (err) {
                debug('Url failed:', err.message || err);
                return reject(err);
            }
            if (resp.statusCode !== 200) {
                msg = 'Wrong status code ' + resp.statusCode + ' for ' + url;
                debug(msg);
                return reject(msg);
            }

            var size = getSize(body);
            if (maxFileSize && maxFileSize < size) {
                msg = 'Too big.  ' + filesize(size) + ' exceeds the allowed ' + filesize(maxFileSize);
                debug(msg);
                return reject(msg);
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


function readAsync(resource, opts) {
    var maxFileSize = result(opts, 'maxFileSize');
    return fs.readFileAsync(resource).then(function (body) {
        var size = getSize(body);
        if (maxFileSize && maxFileSize < size) {
            var msg = 'Too big.  ' + filesize(size) + ' exceeds the allowed ' + filesize(maxFileSize);
            debug(msg);
            return new Error(msg);
        }
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

function getResource(base, file, opts) {
    var maxFileSize = result(opts, 'maxFileSize') || 0;
    var resource = join(base, file);
    var cacheKey = hash({
        file: resource,
        size: maxFileSize
    });


    debug('fetching resource', base, file, resource);

    if (cache[cacheKey]) {
        debug('deliver from cache:', resource);
        return cache[cacheKey];
    }

    if (isUrl(resource)) {
        debug('deliver external:', resource);
        cache[cacheKey] = requestAsync(resource, opts);
    } else {
        debug('deliver local:', resource);
        cache[cacheKey] = readAsync(resource, opts);
    }

    return cache[cacheKey];
}


module.exports.getResource = getResource;
