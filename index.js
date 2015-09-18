var postcss = require('postcss');
var Promise = require('bluebird'); // jshint ignore:line
var isString = require('lodash.isstring');
var defaults = require('lodash.defaults');
var debug = require('debug')('image-inliner');
var escape = require('lodash.escaperegexp');
var map = require('lodash.map');
var last = require('lodash.last');
var getResource = require('./lib/resource').getResource;
var getDataUri = require('./lib/image').getDataUri;


module.exports = postcss.plugin('postcss-image-inliner', function (opts) {
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
        }));
    }

    function getUrl(value) {
        var matcher = /url\(\s*(?:['"]*)(?!['"]*data:)(.*?)(?:['"]*)\s*\)/;
        var match = value.match(matcher);
        return last(match);
    }

    return function (css) {
        var replacements = {};
        var filter = /^background(?:-image)?/;
        css.walkDecls(filter, function (decl) {
            // Store the input file path of the file being processed
            //  var inputPath = decl.source.input.file;
            var url = getUrl(decl.value);

            if (url && !replacements[url]) {
                replacements[url] = resolveUrl(url);
            }
        });

        return Promise.props(replacements)
            .then(getDataUri)
            .then(function (data) {
                css.walkDecls(filter, function (decl) {
                    // Store the input file path of the file being processed
                    //  var inputPath = decl.source.input.file;
                    var url = getUrl(decl.value);

                    if (url && data[url]) {
                        var regexp = new RegExp('[\'"]?' + escape(url) + '[\'"]?');
                        decl.value = decl.value.replace(regexp, '\'' + data[url] + '\'');

                        debug('Converted value:', decl.value );
                    }
                });
            }).catch(function (err) {
                debug(err.message || err);
            });
    };
});
