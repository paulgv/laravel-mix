let webpack = require('webpack');
let webpackMerge = require('webpack-merge')

class Extract {
    /**
     * Create a new component instance.
     */
    constructor() {
        this.entry = null
        this.extractions = [];
    }

    /**
     * Register the component.
     *
     * @param {*} libs
     * @param {string} output
     */
    register(libs, output) {
        this.extractions.push({ libs, output });
    }

    /**
     * Assets to append to the webpack entry.
     *
     * @param {Entry} entry
     */
    webpackEntry(entry) {
        this.entry = entry
    }

    webpackConfig(config) {
        const newConfig = webpackMerge.smart(config, this.config());

        config.optimization = newConfig.optimization
    }

    config() {
        return {
            optimization: {
                // If we are extracting vendor libraries, then we also need
                // to extract Webpack's manifest file to assist with caching.
                runtimeChunk: {
                    name: path.join(this.entry.base, 'manifest').replace(/\\/g, '/'),
                },

                splitChunks: {
                    cacheGroups: this.createCacheGroups(),
                },
            },
        }
    }

    createCacheGroups() {
        const groups = {}

        for (const [index, extraction] of this.extractions.entries()) {
            groups[`vendor${index}`] = this.createCacheGroup(extraction)
        }

        return groups
    }

    createCacheGroup(extraction) {
        const libsPattern = extraction.libs.join("|")
        const pattern = new RegExp(`node_modules/(${libsPattern})`, "i")

        return {
            test: pattern,
            name: this.extractionPath(extraction),
            chunks: "all",
            enforce: true,
        }
    }

    extractionPath(extraction) {
        if (extraction.output) {
            return new File(extraction.output)
                .pathFromPublic(Config.publicPath)
                .replace(/\.js$/, '')
                .replace(/\\/g, '/')
        }

        return path.join(this.entry.base, 'vendor').replace(/\\/g, '/');
    }
}

module.exports = Extract;
