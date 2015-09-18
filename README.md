# PostCSS Image Inliner [![Build Status][ci-img]][ci]

[PostCSS] plugin to inline images into css.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/bezoerb/postcss-image-inliner.svg
[ci]:      https://travis-ci.org/bezoerb/postcss-image-inliner

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

## Usage

```js
postcss([ require('postcss-image-inliner') ])
```

See [PostCSS] docs for examples for your environment.
