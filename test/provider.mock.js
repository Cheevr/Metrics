const metrics = [];
const listeners = {};


module.exports = class {
    get enabled() {
        return true;
    }

    consume(entry) {
        metrics.push(entry);
        for (let cb of listeners.metrics) {
            cb(metrics);
        }
    }
};

module.exports.on = (event, cb) => {
    listeners[event] = listeners.event || [];
    listeners[event].push(cb);
};
