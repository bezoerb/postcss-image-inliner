'use strict';

const debug = require('debug')('image-inliner');
const {getDataUriMapping} = require('./lib/image');

const DEFAULTS = {
  assetPaths: [],
  maxFileSize: 10240,
  b64Svg: false,
  strict: false,
  filter: /^(mask(?:-image)?)|(list-style(?:-image)?)|(background(?:-image)?)|(content)|(cursor)/,
  largeFileCallback: undefined,
  svgoPlugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
        },
      },
    },
  ],
};

const loop = (cb) => {
  const matcher = /url\(\s*['"]*(?!['"]*data:)(.*?)['"]*\s*\)/gm;
  return (decl) => {
    let match;
    while ((match = matcher.exec(decl.value)) !== null) {
      cb({decl, url: match[match.length - 1]});
    }
  };
};

const escapeRegExp = (string) => string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');

module.exports = (options_ = {}) => {
  const options = {...DEFAULTS, ...options_};

  options.assetPaths = Array.isArray(options.assetPaths)
    ? [...options.assetPaths, process.cwd()]
    : [options.assetPaths, process.cwd()];

  return {
    postcssPlugin: 'postcss-image-inliner',
    async Once(root) {
      const urls = new Set([]);
      const {filter} = options;
      // Get urls
      root.walkDecls(
        filter,
        loop(({url}) => urls.add(url))
      );

      const mapping = await getDataUriMapping([...urls], options);

      root.walkDecls(
        filter,
        loop(({decl, url}) => {
          if (mapping[url]) {
            const regexp = new RegExp(`['"]?${escapeRegExp(url)}['"]?`, 'gm');

            decl.value = decl.value.replace(regexp, `'${mapping[url]}'`);
            debug(url, 'successfully replaced with ', mapping[url]);
          } else {
            debug(url, 'failed');
            if (options_.strict) {
              throw new Error(`No file found for ${url}`);
            }
          }
        })
      );
    },
  };
};

module.exports.postcss = true;
