'use strict';

const path = require('path');
const SVGO = require('svgo');
const filesize = require('filesize');
const debug = require('debug')('image-inliner');
const {getResource} = require('asset-resolver');

const svgo = new SVGO();

// Borrowed from https://github.com/filamentgroup/directory-encoder/blob/master/lib/svg-uri-encoder.js
function encodeSvg(content) {
  return (
    encodeURIComponent(
      content
        // Strip newlines and tabs
        .replace(/[\n\r]/gim, '')
        .replace(/\t/gim, ' ')
        // Strip comments
        .replace(/<!--(.*(?=-->))-->/gim, '')
        // Replace
        .replace(/'/gim, '\\i')
    )
      // Encode brackets
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      // Replace ' with "
      .replace(/'/gm, '"')
  );
}

async function reduceAsync(array = [], reducer = (r) => r, initial) {
  for (const index of array.keys()) {
    initial = await reducer(initial, array[index]); /* eslint-disable-line no-await-in-loop */
  }

  return initial;
}

async function assertSize(resource, maxFileSize) {
  const {mime, contents = ''} = resource || {};
  const encoding = mime === 'image/svg+xml' ? 'utf-8' : 'binary';
  const size = Buffer.byteLength(contents, encoding);
  if (maxFileSize && maxFileSize < size) {
    const message = `Too big.  ${filesize(size)} exceeds the allowed ${filesize(maxFileSize)}`;
    throw new Error(message);
  }

  return resource;
}

async function getDataUri(file, options) {
  // If the url is SVG, let's compress and use the XML directly
  if (file.mime === 'image/svg+xml' && !options.b64Svg) {
    const optimized = await svgo.optimize(file.contents.toString('utf-8'));
    return `data:image/svg+xml,${encodeSvg(optimized.data)}`;
  }

  // Otherwise we base64 encode the image
  return `data:${file.mime};base64,${Buffer.from(file.contents, 'binary').toString('base64')}`;
}

async function resolve(filepath, {assetPaths, maxFileSize, resolver = () => undefined}) {
  const filter = (resource) => assertSize(resource, maxFileSize);
  const resolvedFile = await resolver(filepath);
  const base = resolvedFile ? path.dirname(resolvedFile) : assetPaths;
  const file = resolvedFile ? path.basename(resolvedFile) : filepath;

  try {
    return await getResource(file, {base, filter});
  } catch (error) {
    debug(error.message, filepath, 'could not be resolved');
  }
}

function getDataUriMapping(urls = [], options = {}) {
  return reduceAsync(
    [...new Set(urls)],
    async (result, url) => {
      const file = await resolve(url, options);
      if (file && file.mime && /image/.test(file.mime)) {
        result[url] = await getDataUri(file, options);
      }

      return result;
    },
    {}
  );
}

module.exports.getDataUriMapping = getDataUriMapping;
