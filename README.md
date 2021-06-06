# PostCSS Image Inliner [![Build Status][ci-img]][ci]

[PostCSS] plugin to inline local/remote images.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]: https://github.com/bezoerb/postcss-image-inliner/workflows/Tests/badge.svg
[ci]: https://github.com/bezoerb/postcss-image-inliner/actions?workflow=Tests

```css
.foo {
    /* Input example */
    background-image: url("https://placehold.it/10x10");
}
```

```css
.foo {
  /* Output example */
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAo ... ORK5CYII=");
}
```


## Installation

```bash
npm i -D postcss postcss-image-inliner
```

## Usage

```js
const postcss = require('postcss');
const imageInliner = require('postcss-image-inliner');
const opts = {
    assetPaths: [],     // List of directories where the inliner should look for assets
    maxFileSize: 10240  // Sets a max file size (in bytes)
};

postcss([ imageInliner(opts) ]);
```

See [PostCSS] docs for examples for your environment.

## Options

#### assetPaths

* Type: `array`
* Default: `[process.cwd()]`
* Example: `['http://domain.de/', 'http://domain.de/styles', 'app/images', '**/images/']`
* Required: `false`

List of directories/URLs where the inliner should start looking for assets.
You can define local directories (globs supported) or URLs.


#### maxFileSize

* Type: `int`
* Default: `10240`
* Example: `0`
* Required: `false`

Sets a max file size (in bytes) for inlined images. Set to `0` to disable size checking.

#### b64Svg

* Type: `bool`
* Default: `false`
* Required: `false`

Use Base64 encoding for SVGs.

#### strict

* Type: `bool`
* Default: `false`
* Required: `false`

Fail on error.
