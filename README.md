# PostCSS Image Inliner [![Build Status][ci-img]][ci]

[PostCSS] plugin to inline images into css.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/bezoerb/postcss-image-inliner.svg
[ci]:      https://travis-ci.org/bezoerb/postcss-image-inliner

```css
.foo {
    /* Input example */
}
```

```css
.foo {
  /* Output example */
}
```

## Usage

```js
postcss([ require('postcss-image-inliner') ])
```

See [PostCSS] docs for examples for your environment.
