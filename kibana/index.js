const path = require('path');
const Tasks = require('@cheevr/tasks');


class Kibana {
    constructor(config, log) {
        this._enabled = config.enabled === undefined ? true: config.enabled
        this._config = config;
        this._log = log;
        this._task = Tasks.addTask(path.join(__dirname, 'dispatcher'));
    }

    set enabled(enabled) {
        this._enabled = enabled;
    }

    get enabled() {
        return this._enabled;
    }

    consume(metrics) {
        this._task.roundRobin.sendMetrics(metrics);
    }
}

module.exports = Kibana;
