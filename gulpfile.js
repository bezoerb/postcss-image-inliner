var gulp = require('gulp');

var files = ['index.js', 'lib/*.js', 'test/*.js', 'gulpfile.js'];

gulp.task('lint', function () {
    var eslint = require('gulp-eslint');
    return gulp.src(files)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('test', function () {
    var mocha = require('gulp-mocha');
    return gulp.src('test/*.js', { read: false })
        .pipe(mocha({ timeout: 1000000 }));
});

gulp.task('default', ['lint', 'test']);

gulp.task('watch', function () {
    gulp.watch(files, ['lint', 'test']);
});
