const { parallel, series, watch, src, dest } = require('gulp')
const del = require('del')
const uglify = require('gulp-uglify')
const sass = require('gulp-sass')
const autoprefixer = require('gulp-autoprefixer')
const connect = require('gulp-connect')
const rename = require("gulp-rename")
const copy = require('gulp-copy')
const babel = require('gulp-babel')
const inject = require('gulp-inject');

// clean
function taskClean (done) {
  del.sync('./dist')
  done()
}

// clean css
function taskCleanCss (done) {
  del.sync('./dist/app.css')
  done()
}

// html
function taskHtml () {
  return src('./src/index.html')
  .pipe(dest('./dist'))
  .pipe(connect.reload()) // reload解决热加载问题，js和css资源同理
}

function taskProdHtml () {
  return src('./src/index.html')
  .pipe(inject(src(['./dist/app.css']), {
    starttag: '<!-- inject:FileContent:{{ext}} -->', // '<!-- -->'这是关键，判断插入位置
    endtag: '<!-- endinject -->',
    relative: true,
    transform: function (filePath, file) {
      if(filePath.slice(-4) === '.css'){
        return '<style>' + file.contents.toString('utf8') + '</style>'
      }
      // 将文件内容作为字符串返回
      return file.contents.toString('utf8')
    }
  }))
  .pipe(dest('./dist'))
  .pipe(connect.reload()) // reload解决热加载问题，js和css资源同理
}

// scss
function taskScss () {
  return src('./src/**/*.scss')
  .pipe(sass({
    outputStyle: 'compressed'
  }))
  .pipe(autoprefixer({
    cascade: false,
    remove: false // 删除过时的prefixer
  }))
  .pipe(dest('./dist'))
  .pipe(connect.reload()) // reload解决热加载问题，js和css资源同理
}

// script
function taskScript() {
 return src('./src/**/app.js')
  .pipe(babel({
    presets: ['@babel/env']
  }))
  .pipe(uglify())
  .pipe(rename('app.js'))
  .pipe(dest('./dist'))
}

// image
function taskImage() {
  return src(['./src/img/*.png', 'src/img/*.jpg'])
   .pipe(copy('./dist', {
    prefix: true
   }))
}

// fonts
function taskFont() {
  return src(['./src/fonts/*.woff', './src/fonts/*.woff2'])
   .pipe(copy('./dist', {
    prefix: true
   }))
}
 
//  watch
function assetsWatch() {
  watch("src/**/*.html", series(taskHtml))
  watch("src/**/*.js", series(taskScript))
  watch("src/**/*.scss", series(taskScss))
}

// server
function server() {
  connect.server({
    root: './dist',
    port: 8080,
    livereload: true
  })
}
// serve
const serveTask = parallel(series(taskClean, taskImage, taskFont, taskScss, taskHtml, taskScript, server), assetsWatch)

// prod
const buildTask = series(taskClean, taskImage, taskFont, taskScss, taskProdHtml, taskScript, taskCleanCss)

exports.default = process.env.NODE_ENV === 'prod' ? buildTask: serveTask

