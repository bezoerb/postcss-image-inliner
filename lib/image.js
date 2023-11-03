'use strict';

const path = require('path');
const {optimize /* , extendDefaultPlugins */} = require('svgo');
const filesize = require('filesize');
const debug = require('debug')('image-inliner');
const {getResource} = require('asset-resolver');

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

async function assertSize(resource, maxFileSize, throwError = true) {
  const {mime, contents = ''} = resource || {};
  const encoding = mime === 'image/svg+xml' ? 'utf-8' : 'binary';
  const size = Buffer.byteLength(contents, encoding);
  if (maxFileSize && maxFileSize < size) {
    if (!throwError) return false;

    const message = `Too big.  ${filesize(size)} exceeds the allowed ${filesize(maxFileSize)}`;
    throw new Error(message);
  }

  return resource;
}

async function getDataUri(file, options) {
  // If the url is SVG, let's compress and use the XML directly
  if (file.mime === 'image/svg+xml' && !options.b64Svg) {
    const optimized = await optimize(file.contents.toString('utf-8'), {
      path: file.path,
      multipass: true,
      plugins: options.svgoPlugins,
    });
    return `data:image/svg+xml,${encodeSvg(optimized.data)}`;
  }

  // Otherwise we base64 encode the image
  return `data:${file.mime};base64,${Buffer.from(file.contents, 'binary').toString('base64')}`;
}

async function resolve(filepath, {assetPaths, maxFileSize, largeFileCallback, resolver = () => undefined}) {
  const filter = (resource) => assertSize(resource, maxFileSize, !largeFileCallback);
  const resolvedFile = await resolver(filepath);
  const base = resolvedFile ? path.dirname(resolvedFile) : assetPaths;
  const file = resolvedFile ? path.basename(resolvedFile) : filepath;

  try {
    return await getResource(file, {base, filter});
  } catch (error) {
    debug(error.message, filepath, 'could not be resolved');
  }
}

async function getDataUriMapping(urls = [], options = {}) {
  const uniqueUrls = [...new Set(urls)];
  const promises = uniqueUrls.map(async (url) => {
    const file = await resolve(url, options);
    if (file && file.mime && /image/.test(file.mime)) {
      return [url, await getDataUri(file, options)];
    }

    if (options.largeFileCallback) {
      const largeFile = await resolve(url, {...options, maxFileSize: 0});
      if (largeFile && largeFile.mime && /image/.test(largeFile.mime)) {
        return [url, await options.largeFileCallback(largeFile)];
      }
    }

    return [url, null];
  });
  const results = await Promise.all(promises);
  return Object.fromEntries(results);
}

module.exports.getDataUriMapping = getDataUriMapping;
