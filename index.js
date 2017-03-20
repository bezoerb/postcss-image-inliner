'use strict';
const postcss = require('postcss');
const Bluebird = require('bluebird');
const isString = require('lodash.isstring');
const defaults = require('lodash.defaults');
const debug = require('debug')('image-inliner');
const escape = require('lodash.escaperegexp');
const last = require('lodash.last');
const reduce = require('lodash.reduce');
const filesize = require('filesize');
const getResource = require('asset-resolver').getResource;
const getDataUri = require('./lib/image').getDataUri;

module.exports = postcss.plugin('postcss-image-inliner', opts => {
    opts = defaults(opts || {}, {
        assetPaths: [],
        maxFileSize: 10240,
        b64Svg: false,
        strict: false
    });

    if (isString(opts.assetPaths)) {
        opts.assetPaths = [opts.assetPaths];
    }

    opts.assetPaths.push(process.cwd());

    function assertSize(resource) {
        const encoding = resource.mime === 'image/svg+xml' ? 'utf-8' : 'binary';
        const size = Buffer.byteLength(resource.contents, encoding);
        if (opts.maxFileSize && opts.maxFileSize < size) {
            const msg = 'Too big.  ' + filesize(size) + ' exceeds the allowed ' + filesize(opts.maxFileSize);
            debug(msg);
            return Bluebird.reject(new Error(msg));
        }

        return resource;
    }

    function resolveUrl(filepath) {
        return getResource(filepath, {
            base: opts.assetPaths,
            filter: assertSize
        }).catch(err => {
            debug(err.message, filepath, 'could not be resolved');
        });
    }

    function loop(cb) {
        const matcher = /url\(\s*(?:['"]*)(?!['"]*data:)(.*?)(?:['"]*)\s*\)/gm;
        return function (decl) {
            let match;
            while ((match = matcher.exec(decl.value)) !== null) {
                cb(decl, last(match));
            }
        };
    }

    function compact(data) {
        return reduce(data, (acc, file, key) => {
            if (file && file.mime) {
                acc[key] = file;
            }
            return acc;
        }, {});
    }

    return function (css) {
        const replacements = {};
        const filter = /^(background(?:-image)?)|(content)|(cursor)/;
        css.walkDecls(filter, loop((decl, url) => {
            replacements[url] = resolveUrl(url);
        }));

        return Bluebird.props(replacements)
            .then(compact)
            .then(file => {
                return getDataUri(file, opts);
            })
            .then(data => {
                css.walkDecls(filter, loop((decl, url) => {
                    if (data[url]) {
                        const regexp = new RegExp('[\'"]?' + escape(url) + '[\'"]?');
                        decl.value = decl.value.replace(regexp, '\'' + data[url] + '\'');
                        debug(url, 'successfully replaced with ', data[url]);
                    } else {
                        debug(url, 'failed');
                        if (opts.strict) {
                            throw new Error('No file found for ' + url);
                        }
                    }
                }));
            }).catch(err => {
                debug(err);
                return new Bluebird((resolve, reject) => {
                    reject(err);
                });
            });
    };
});
