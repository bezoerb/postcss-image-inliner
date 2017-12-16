const gulp = require('gulp');

const files = ['index.js', 'lib/*.js'];

gulp.task('lint', () => {
	const eslint = require('gulp-eslint');
	return gulp.src(files)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('test', () => {
	const mocha = require('gulp-mocha');
	return gulp.src('test/*.js', {read: false})
        .pipe(mocha({timeout: 1000000}));
});

gulp.task('default', ['lint', 'test']);

gulp.task('watch', () => {
	gulp.watch(files, ['lint', 'test']);
});
