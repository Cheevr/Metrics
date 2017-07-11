# Metrics
A metrics module that allows to easily send data to various backends.

[![npm version](https://badge.fury.io/js/%40cheevr%2Fmetrics.svg)](https://badge.fury.io/js/%40cheevr%2Fmetrics)
[![Build Status](https://travis-ci.org/Cheevr/Metrics.svg?branch=master)](https://travis-ci.org/Cheevr/Metrics)
[![Coverage Status](https://coveralls.io/repos/Cheevr/Metrics/badge.svg?branch=master&service=github)](https://coveralls.io/github/Cheevr/Metrics?branch=master)
[![Dependency Status](https://david-dm.org/Cheevr/Metrics.svg)](https://david-dm.org/Cheevr/Metrics)

# About

This module serves as an abstraction layer over various metrics collection services. It makes use of a few other
services to simplify logging and configuration and supports file based, tier specific configurations.

## Installation

```Bash
npm i @cheevr/metrics
```


# Express Example

This tool makes use of the [@cheevr/config](https://github.com/cheevr/config) module. You don't need to set up
any configuration files if you have a local Kibana instance running, but just in case you want to edit a few
things, this is what a configuration file under **config/default.json** could look like:

```JavaScript
{
    "metrics": {
        "type": "newrelic",
        "database": "kibana"
    },
    "database": {
        "kibana": {
            "client": "localhost:9200"
        }
    }
}
```

For more details on specifying the database used by kibana check out the
[@cheevr/database](https://github.com/cheevr/database) module.

To use the metrics module with express is pretty straight forward:

```JavaScript
const Metrics = require('@cheevr/metrics');
const express = require('express');

const app = express();
app.use(Metrics.middleware);
```

With this configuration the module will start collecting metrics for any incoming requests automatically.


# API

The API for the metrics module is very limited in comparison to other modules in the cheevr environment.
The functionality has (so far) been focused purely on supporting the use case of a web server and is part of
the [@cheevr/server](https://github.com/cheevr/server) module. Future plans include a more general API that
allows a developer to add metrics directly (and service agnostically).

## Metrics.enabled {boolean}

This property allows to enable or disable metrics collection at runtime.

## Metrics.middleware({ClientRequest} req, {ServerResponse} res, {function} next)

This is a helper method that will do 2 things:
* Create a metrics property on the request object
* Automatically add metrics from an incoming request and outgoing response to that object

The request object supports nesting metrics and a number of useful data is collected out of the box. If you
want you can add additional information to the existing information and it will be indexed along the existing
data. The current data collected looks like this:

```JavaScript
req.metrics = {
    '@timestamp': new Date(),               // When did the request arrive
    process: process.pid,                   // Id of the process that handled the request
    hostname: require('os').hostname(),     // hostname of the maching (not the request hostname)
    application: path.basename(path.dirname(require.main.filename))
    tier: config.tier,                      // name of the configured tier (e.g. dev/staging/prod)
    trackingId: req.id,                     // an optional id if the request object has that property
    args: req.args,                         // incoming req arguments if the request object has nay
    request: {
        method: req.method,                 // GET, POST, DELETE, etc.
        url: req.originalUrl,               // The originally called url e.g. http://myserver.com:8080/hello
        ip: req.ip,                         // The source ip of the request
        size: req.socket.bytesRead,         // Size of the incoming request in bytes
    },
    response: {
        status: res.statusCode,             // HTTP status code e.g. 200, 404, 500
        size: req.socket.bytesWritten,      // Size of the response in bytes
        time: <calculated response time>    // Time in ms that was required to complete the request
    }
}
```


## Metrics.provider {object}

Writeonly property that allows to set the configuration at runtime. Note that the enabled flag will overwrite
any runtime settings, so if you set enabled to false before you should do it again here, otherwise the provider
will be enabled by default To see details about the configuration check out the [Configuration](#Configuration)
section below. When passing in a configuration you should not nest it under a **metrics** property:

```JavaScript
const Metrics = require('@cheevr/metrics'):
Metrics.provider = {
    type: "newrelic",
    logger: "mymetrics"
}
```


# Configuration

### type {string} = "kibana"

This property will specify which provider to load and defaults to loading the kibana implementation. Currently
only 2 options are available: "kibana" and "newrelic", but expect other implementation to be added over time.
For more information on those two implementations check the sections below.

### logger {string} = "metrics"

This module makes use of [@cheevr/logger](https://github.com/cheevr/logger) for all logging purposes. This
property will tell the metrics module which logger to use. To see how to configure loggers check out the logger
project. The default name for all logging operations is called "metrics" set to log warning level and higher
messages.

## Kibana

//TODO explain @cheevr/database usage

## New Relic

// TODO explain newrelic config file

# Future Features for Consideration

* Support more metrics collectors
* Support direct storing of metrics (opposed to only doing automatic and web stats)
