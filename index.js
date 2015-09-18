var postcss = require('postcss');
var Promise = require('bluebird'); // jshint ignore:line
var isString = require('lodash.isstring');
var defaults = require('lodash.defaults');
var debug = require('debug')('image-inliner');
var escape = require('lodash.escaperegexp');
var map = require('lodash.map');
var last = require('lodash.last');
var reduce = require('lodash.reduce');
var getResource = require('./lib/resource').getResource;
var getDataUri = require('./lib/image').getDataUri;


module.exports = postcss.plugin('postcss-image-inliner', function (opts) {
   // var matcher = /url\(\s*(?:['"]*)(?!['"]*data:)(.*?)(?:['"]*)\s*\)/gm;

    opts = defaults(opts || {}, {
        assetPaths: []
    });

    if (isString(opts.assetPaths)) {
        opts.assetPaths = [opts.assetPaths];
    }

    opts.assetPaths.push(process.cwd());

    function resolveUrl(filepath) {
        return Promise.any(map(opts.assetPaths, function (base) {
            return getResource(base, filepath, opts);
        })).catch(function (err) {
            debug(err.message || err, filepath, 'could not be resolved');
        });
    }

    function loop(cb) {
        var matcher = /url\(\s*(?:['"]*)(?!['"]*data:)(.*?)(?:['"]*)\s*\)/gm;
        return function (decl) {
            var match;
            while ((match = matcher.exec(decl.value)) !== null) {
                cb(decl, last(match));
            }
        };
    }

    function compact(data) {
        return reduce(data, function (acc, file, key) {
            if (file && file.mime) {
                acc[key] = file;
            }
            return acc;
        }, {});
    }

    return function (css) {
        var replacements = {};
        var filter = /^background(?:-image)?/;
        css.walkDecls(filter, loop(function (decl, url) {
            replacements[url] = resolveUrl(url);
        }));

        return Promise.props(replacements)
            .then(compact)
            .then(getDataUri)
            .then(function (data) {
                css.walkDecls(filter, loop(function (decl, url) {
                    if (data[url]) {
                        var regexp = new RegExp('[\'"]?' + escape(url) + '[\'"]?');
                        decl.value = decl.value.replace(regexp, '\'' + data[url] + '\'');
                        debug(url, 'successfully replaced');
                    } else {
                        debug(url, 'failed');
                    }
                }));
            }).catch(function (err) {
                debug(err.message || err);
            });
    };
});
