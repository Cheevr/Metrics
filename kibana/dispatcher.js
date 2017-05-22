const _ = require('lodash');
const config = require('@cheevr/config').addDefaultConfig(__dirname, '../config');
const Database = require('@cheevr/database');
const geoip = require('geoip-lite');
const Logger = require('@cheevr/logging');


const kibanaConfig = _.defaultsDeep(config.metrics, config.defaults.metrics[config.metrics.type]);
const index = kibanaConfig.index;
const defaultType = kibanaConfig.type;
const bulkSize = 100;
const buffer = [];
const log = Logger[kibanaConfig.logger];
const db = Database.factory(kibanaConfig.database);

/**
 * The method that will be called by the task runner.
 */
module.exports = exports = Runner => {
    Runner.job({
        name: 'Metrics Exporter',
        interval: '10s',
    }, context => {
        exports.poll(context.resolve);
    });
};

/**
 * Receiver method from parent tasks
 * @param metrics
 */
exports.sendMetrics = metrics => {
    buffer.push(metrics);
};

/**
 * Looks for the ip field in the request data and adds geo data information for kibana to consume.
 * @param metric
 */
exports.setGeoIP = metric => {
    if (!metric.request || !metric.request.ip) {
        return;
    }
    let ip = metric.request.ip;
    ip = ip.startsWith('::ffff:') ? ip.substr(7) : ip;
    let geo = geoip.lookup(ip);
    if (geo && geo.ll) {
        metric.geoip = {
            latitude: geo.ll[0],
            longitude: geo.ll[1],
            location: geo.ll[0] + ',' + geo.ll[1]
        };
    }
};

/**
 * Fetches any buffered metrics and sends them to Kibana in a bulk request.
 */
exports.poll = async cb => {
    while (buffer.length) {
        let metrics = buffer.splice(0, bulkSize);
        let bulkRequest = [];
        for (let metric of metrics) {
            exports.setGeoIP(metric);
            bulkRequest.push({index: {_index: index, _type: defaultType}});
            bulkRequest.push(metric);
        }
        db.bulk({
            body: bulkRequest
        }, err => err && log.error('Unable to send metrics to Kibana', err));
    }
    cb && cb();
};

process.on('SIGTERM', () => exports.poll());
