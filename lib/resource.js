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

function getSize(string, binary) {
    return Buffer.byteLength(string, binary ? 'binary' : 'utf-8');
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
                msg = 'Wrong status code ' + resp.statusCode + ' for ' + resource;
                debug(msg);
                return reject(msg);
            }

            var mimeType = result(resp, 'headers.content-type') || mime.lookup(resource);
            var size = getSize(body, mimeType !== 'image/svg+xml');
            if (maxFileSize && maxFileSize < size) {
                msg = 'Too big.  ' + filesize(size) + ' exceeds the allowed ' + filesize(maxFileSize);
                debug(msg);
                return reject(msg);
            }

            debug('Fetched:', resource);
            resolve({
                contents: body,
                path:     resource,
                mime:     mimeType
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
        var mimeType = mime.lookup(resource);
        var size = getSize(body, mimeType !== 'image/svg+xml');
        if (maxFileSize && maxFileSize < size) {
            var msg = 'Too big.  ' + filesize(size) + ' exceeds the allowed ' + filesize(maxFileSize);
            debug(msg);
            return new Error(msg);
        }
        debug('Fetched:', resource);
        return {
            contents: body,
            path:     resource,
            mime:     mimeType
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

    if (cache[cacheKey]) {
        return cache[cacheKey];
    }

    if (isUrl(resource)) {
        cache[cacheKey] = requestAsync(resource, opts);
    } else {
        cache[cacheKey] = readAsync(resource, opts);
    }
    return cache[cacheKey];
}


module.exports.getResource = getResource;
