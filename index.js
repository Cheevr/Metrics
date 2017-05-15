const _ = require('lodash');
const config = require('@cheevr/config').addDefaultConfig(__dirname, 'config');
const Logging = require('@cheevr/logging');
const path = require('path');
const shortId = require('shortid');


// Regex safe short ids
shortId.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@_');
const hostname = require('os').hostname();
const application = path.basename(path.dirname(require.main.filename));

class Metrics {
    constructor() {
        this.provider = config.metrics;
    }

    /**
     * Uses the given configuration to set up the metrics collection system. Setting a provider will automatically
     * enable metrics collection if it has been manually disabled before.
     * @param metricsConfig
     */
    set provider(metricsConfig) {
        metricsConfig = _.defaultsDeep(metricsConfig, config.defaults.metrics[metricsConfig.type]);
        this._log = Logging[config.logger];
        this._sink = new require('./' + metricsConfig.type)(metricsConfig, this._log);
    }

    set enabled(enabled) {
        this._sink.enabled = enabled;
    }

    get enabled() {
        return this._sink.enabled;
    }

    /**
     * A request handler that will record metrics and store them on the request object. The handler will update additional
     * metrics once the response has returned.
     * @param {ClientRequest} req
     * @param {ServerResponse} res
     * @param {function} next
     */
    async middleware(req, res, next) {
        if (!this._sink.enabled) {
            return next();
        }
        let startTime = process.hrtime();
        req.id = req.get('id') || shortId.generate();
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
            req.metrics.response = { status, size, time };
            this._sink.consume(req.metrics);
        });
        next();
    }
}


module.exports = new Metrics();
