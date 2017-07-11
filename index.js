const _ = require('lodash');
const config = require('@cheevr/config').addDefaultConfig(__dirname, 'config');
const Logging = require('@cheevr/logging');
const path = require('path');


const hostname = require('os').hostname();
const application = path.basename(path.dirname(require.main.filename));

class Metrics {
    constructor() {
        this.provider = config.metrics;
    }

    /**
     * Uses the given configuration to set up the metrics collection system. In case metrics were disabled
     * before, this setting will be overridden if not also disabled in the passed in config.
     * @param {Object} metricsConfig
     */
    set provider(metricsConfig) {
        metricsConfig = _.defaultsDeep(metricsConfig, config.defaults.metrics[metricsConfig.type]);
        if (!metricsConfig.enabled) {
            return;
        }
        this._log = Logging[config.logger];
        let Provider = require('./' + metricsConfig.type);
        this._provider = new Provider(metricsConfig, this._log);
    }

    set enabled(enabled) {
        this._provider.enabled = enabled;
    }

    get enabled() {
        return this._provider.enabled;
    }

    /**
     * A request handler that will record metrics and store them on the request object. The handler will update additional
     * metrics once the response has returned.
     * @param {ClientRequest} req
     * @param {ServerResponse} res
     * @param {function} next
     */
    middleware(req, res, next) {
        if (!module.exports._provider.enabled) {
            return next();
        }
        let startTime = process.hrtime();
        req.metrics = {
            '@timestamp': new Date(),
            process: process.pid,
            hostname,
            application,
            tier: config.tier,
            request: {
                method: req.method,
                url: req.originalUrl,
                ip: req.ip
            }
        };
        res.on('finish', () => {
            let endTime = process.hrtime(startTime);
            let time = Math.round(endTime[0] * 1e3 + endTime[1] * 1e-6);
            let status = res.statusCode;
            let size = req.socket.bytesWritten;
            req.args && (req.metrics.request.args = req.args);
            req.metrics.request.size = req.socket.bytesRead;
            req.metrics.tackingId = req.id;
            req.metrics.response = { status, size, time };
            module.exports._provider.consume(req.metrics);
        });
        next();
    }
}


module.exports = new Metrics();
