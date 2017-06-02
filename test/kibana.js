/* global describe, it, after, before, afterEach, beforeEach */

const Database = require('@cheevr/database');
const expect = require('chai').expect;
const express = require('express');
const gently = require('gently');
const Metrics = require('..');
const MockProvider = require('./provider.mock');
const request = require('supertest');


describe('Metrics', () => {
    it('should log metrics from a request to database', done => {
        Metrics.provider = { type: 'test/provider.mock', enabled: true };
        const app = express();
        app.use(Metrics.middleware);
        app.get('/', (req, res) => res.end());
        MockProvider.on('metrics', metrics => {
            expect(metrics.length).to.equal(1);
            done();
        });

        request(app).get('/').end(err => {
            if (err) throw err;
        });
    });
});
