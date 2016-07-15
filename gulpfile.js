const gulp = require('gulp');
const watch = require('gulp-watch');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const babel = require('gulp-babel');

const PROJECT_PATH = './app/www/';

gulp.task('build-angular',function () {
    gulp.src(PROJECT_PATH + 'app/**/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
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