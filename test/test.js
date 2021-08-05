const request = require('supertest');
const assert = require('assert');
const fs = require('fs');
const app = require('../main.js');

describe('GET /', function() {
    // load the app and check the response is "Health Checkup"
    it('Apply Healthcheckup', function(done) {
        request(app).get('/').expect('Health Checkup', done);
    });
    // check the response is generated
    it('Check Response', function() {
        var file = './data/response.csv';
        const data = () => fs.readFile(file, 'utf8', function(err, data){
            assert.deepEqual(typeof data, 'string', 'Response not generated');
            return data;
        });
        data();
    });
});
