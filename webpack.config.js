const path = require('path')
const clone = require('clone')

var mainConfig = {
	entry: './tetrapod.js',
	mode: 'production',
	devtool: 'none',
	target: 'web',
	output: {
		filename: 'tetrapod.js',
		path: path.resolve(__dirname, 'build'),
		publicPath: './',

		library: 'Tetrapod',
		libraryTarget: 'this',
		libraryExport: 'default'
	},

	plugins: [],

	module: {
		unsafeCache: true,
		rules: [{
			test: /\.js$/,
			include: path.join(__dirname),
			exclude: /(node_modules)|(dist)/,
			use: {
				loader: 'babel-loader',
				query: {
					presets: ['@babel/preset-env'],
					plugins: []
				}
			}
		}]
	},

	optimization: {
		minimize: true
	},

	node: {
		console: false,

		global: true,
		process: true,
		setImmediate: false,
	
		path: true,
		url: false,

		Buffer: true,
		__filename: false,
    	__dirname: false,

		fs: 'empty',
		net: 'empty',
		dns: 'empty',
		dgram: 'empty',
		tls: 'empty'
	}
}

/*
var testConfig = clone(mainConfig)
testConfig['entry'] = './test/client.js'
testConfig['output']['filename'] = 'test.js'
testConfig['output']['library'] = 'client'
*/

module.exports = [mainConfig]