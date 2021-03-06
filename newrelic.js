const flat = require('flat');
const fs = require('fs');
const newrelic = require('newrelic');
require('@newrelic/native-metrics');
const path = require('path');


if (!fs.existsSync(path.join(process.cwd(), 'newrelic.js'))) {
    throw new Error('Unable to launch new relic metrics collection without a configuration file in project directory');
}

class NewRelic {
    constructor(config, log) {
        this._enabled = config.enabled === undefined ? true: config.enabled;
        this._config = config;
        this._log = log;
    }

    set enabled(enabled) {
        this._enabled = enabled;
    }

    get enabled() {
        return this._enabled;
    }

    consume(metrics) {
        metrics = flat(metrics);
        for (let prop in metrics) {
            let index = prop.lastIndexOf('.');
            if (index > -1) {
                prop = prop.substr(0, index) + '/' + prop.substr(index + 1);
            }
            newrelic.recordMetric('Custom/' + prop, metrics[prop]);
        }
    }
}

module.exports = NewRelic;
