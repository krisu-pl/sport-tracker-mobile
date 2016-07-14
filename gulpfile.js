var gulp = require('gulp');
var watch = require('gulp-watch');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

var PROJECT_PATH = './app/www/';

gulp.task('build-angular',function () {
    gulp.src(PROJECT_PATH + 'app/**/*.js')
        .pipe(concat('app.js'))
        .on('error', swallowError)
        .pipe(gulp.dest(PROJECT_PATH + 'assets/js'))
        .pipe(uglify())
        .on('error', swallowError)
        .pipe(rename('app.min.js'))
        .pipe(gulp.dest(PROJECT_PATH + 'assets/js'))
});

function swallowError (error) {
    console.log(error.toString());
    this.emit('end');
}

gulp.task('watch', ['build-angular'], function() {
    gulp.watch(PROJECT_PATH + 'app/**/*.js', ['build-angular']);
});