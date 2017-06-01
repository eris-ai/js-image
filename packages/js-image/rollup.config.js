const path = require('path')
const resolve = require('rollup-plugin-node-resolve')
const alias = require('rollup-plugin-alias')
const commonjs = require('rollup-plugin-commonjs')

const fsshim = path.join(__dirname, 'lib/shims/fs.js')
const pngshim = path.join(__dirname, 'lib/shims/png-js.js')
const jpegshim = path.join(__dirname, 'lib/shims/jpeg-js.js')

module.exports = {
  entry: 'lib/browser-index.js',
  dest: 'dist/bundle.js',
  moduleName: '@ouranos/image',
  format: 'umd',
  sourceMap: true,
  exports: 'named',
  plugins: [
    alias({
      fs: fsshim,
      pngjs: pngshim,
      '@ouranos/jpeg-js': jpegshim,
    }),
    resolve({jsnext: true, main: true}),
    commonjs({}),
  ],
}
