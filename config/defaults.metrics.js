module.exports = {
    kibana: {
        enabled: true,
        memory: 128,
        database: '_default_',
        index: 'logstash',
        type: 'metric'
    },
    newrelic: {
        enabled: true
    }
};
