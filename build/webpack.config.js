/**
 * /dist/websocket-mg.min.js配置打包
 */
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const utils = require('./utils')

// 打包输出路径
const distPath = utils.rootPath('dist')

module.exports = {
  mode: 'production',
  entry: utils.rootPath('src/main.js'),
  output: {
    path: distPath,
    filename: 'websocket-mg.min.js',
    library: 'WebSocketMG',
    libraryTarget: 'umd',
    globalObject: 'this',
    umdNamedDefine: true,
  },
  plugins: [
    new CleanWebpackPlugin({
      dry: true,
      verbose: true,
      dangerouslyAllowCleanPatternsOutsideProject: true,
      cleanOnceBeforeBuildPatterns: [distPath + '/websocket-mg.min.js']
    })
  ],
}
