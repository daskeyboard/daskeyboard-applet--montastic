const q = require('daskeyboard-applet');
const request = require('request-promise');
const logger = q.logger;

const serviceUrl = 'https://www.montastic.com/checkpoints/index';

class QMontastic extends q.DesktopApp {
  constructor() {
    super();
    // run every 1 min
    this.pollingInterval = 1 * 60 * 1000;
  }

  async applyConfig() {
    this.serviceHeaders = {
      "Content-Type": "application/json",
      "X-API-KEY": this.authorization.apiKey,
    }
  }

  /** ping Montastic and set the signal  */
  async run() {
    const upColor = this.config.upColor || '#00FF00';
    const downColor = this.config.downColor || '#FF0000';
    const upEffect = this.config.upEffect || 'SET_COLOR';
    const downEffect = this.config.downEffect || 'BLINK';
    return request.get({
      url: serviceUrl,
      headers: this.serviceHeaders,
      json: true
    }).then((body) => {
      let color = upColor;
      let triggered = false;
      let alerts = [`ALARM `];
      let effect = upEffect;

      for (let monitor of body) {
        // extract the important values from the response
        let status = monitor.status;
        let monitorId = monitor.id;

        logger.info(`For monitor ${monitorId}, got status: ${status}`);

        if (status === -1) {
          triggered = true;
          color = downColor;
          effect = downEffect;
          alerts.push(monitor.url + " is down!");
          logger.info("Sending alert on " + monitor.url + " is down");
        }

      }

      if (triggered) {
        let signal = new q.Signal({
          points: [[new q.Point(color, effect)]],
          name: "Montastic",
          message: alerts.join('<br>'),
          link: {
            url: 'https://www.montastic.com/checkpoints',
            label: 'Show in Montastic',
          }
        });
        return signal;
      } else {
        let signal = new q.Signal({
          points: [[new q.Point(color, effect)]],
          name: "Montastic",
          message: `Everything is OK.`,
          link: {
            url: 'https://www.montastic.com/checkpoints',
            label: 'Show in Montastic',
          }
        });
        return signal;
      }

    })
      .catch(error => {
        logger.error(
          `Got error sending request to service: ${JSON.stringify(error)}`);
          if(`${error.message}`.includes("getaddrinfo")){
            return q.Signal.error(
              'The Montastic service returned an error. <b>Please check your internet connection</b>.'
            );
          }
          return q.Signal.error([
            'The Montastic service returned an error. <b>Please check your API key and account</b>.',
            `Detail: ${error.message}`
          ]);
      });
  }

  locateMonitor(monitorId) {
    for (let i = 0; i < this.config.monitors.length; i++) {
      if (this.config.monitors[i] == monitorId) {
        return i;
      }
    }
  }
}


const montastic = new QMontastic();

module.exports = {
  QMontastic: QMontastic
}