const path = require('path');

module.exports = {
    entry: './src/index.js',
    devtool: 'inline-source-map',
    module: {
        rules: [{
            test: /\.script\.js$/,
            use: [{
                loader: 'script-loader',
                options: {
                    sourceMap: true,
                },
            }]
        }, {
            test: /\.js$/,
            use: ["source-map-loader"],
            enforce: "pre"
        }],
    },
    resolve: {
        extensions: ['.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'webpackLib'
    },
    mode: "development",
    optimization: {
        concatenateModules: true,
        minimize: true,
        splitChunks: {
            chunks: 'async',
            minSize: 30000,
            maxSize: 0,
            minChunks: 1,
            maxAsyncRequests: 6,
            maxInitialRequests: 4,
            automaticNameDelimiter: '~',
            cacheGroups: {
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true
                }
            }
        }
    }
};