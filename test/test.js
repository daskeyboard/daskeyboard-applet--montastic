const assert = require('assert');
const {
  QMontastic
} = require('../index');

describe('QMontastic', function () {

  describe('#run()', function () {
    it('runs normally', async function () {
      return buildApp().then(app => {
        return app.run().then((signal) => {
          console.log(JSON.stringify(signal));
          assert.ok(signal);
          assert.ok(signal.link.url);
          assert.ok(signal.link.label);
        }).catch(error => {
          assert.fail(error);
        });
      });
    });
    it('returns an error when the API fails', async function () {
      return buildApp({
        authorization: {
          apiKey: 'mickey mouse',
        }
      }).then(async app => {
        return app.run().then((signal) => {
          assert.ok(signal);
          assert.equal('ERROR', signal.action);
        }).catch(error => {
          assert.fail(error);
        });
      });
    });
  });
});


const defaultConfig = Object.freeze({
  authorization: {
    apiKey: '8f652e62a922ca351521ea0b89199de1067d3204'
  }
});

async function buildApp(config) {
  let app = new QMontastic();

  // set up the test with a test account's API Key
  return app.processConfig(config || defaultConfig).then(() => {
    return app;
  });
}