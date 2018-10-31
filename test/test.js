const assert = require('assert');
const t = require('../index');

describe('QMontastic', function () {
  let app = new t.QMontastic();

  // set up the test with a test account's API Key
  app.processConfig({
    authorization: {
      apiKey: '8f652e62a922ca351521ea0b89199de1067d3204'
    }
  });

  it('#run()', function () {
    app.run().then((signal) => {
      console.log(JSON.stringify(signal));
      assert.ok(signal);
    }).catch(error => {
      assert.fail(error);
    });
  });
});