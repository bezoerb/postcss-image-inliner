# PostCSS Image Inliner [![Build Status][ci-img]][ci]

[PostCSS] plugin to inline images into css.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/bezoerb/postcss-image-inliner.svg
[ci]:      https://travis-ci.org/bezoerb/postcss-image-inliner

```css
.foo {
    /* Input example */
    background-image: url("https://placeholdit.imgix.net/~text?txtsize=5&txt=10%C3%9710&w=10&h=10&txtpad=1");
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
