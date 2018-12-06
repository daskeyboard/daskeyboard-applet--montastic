const q = require('daskeyboard-applet');
const request = require('request-promise');
const logger = q.logger;

const serviceUrl = 'https://www.montastic.com/checkpoints/index';

const responseColors = {
  "0": '#FFFF00',
  "1": '#00FF00',
  "-1": '#FF0000'
}

const responseEffects = {
  "0": q.Effects.BOUNCING_LIGHT,
  "1": q.Effects.SET_COLOR,
  "-1": q.Effects.BLINK
}


class QMontastic extends q.DesktopApp {
  constructor() {
    super();
    this.lastMonitors = {};
  }

  async applyConfig() {
    this.serviceHeaders = {
      "Content-Type": "application/json",
      "X-API-KEY": this.authorization.apiKey,
    }
  }

  /** ping Montastic and set the signal  */
  async run() {
    return request.get({
        url: serviceUrl,
        headers: this.serviceHeaders,
        json: true
      }).then((body) => {
        let color = '#00FF00';
        let triggered = false;
        let alerts = [];

        for (let monitor of body) {
          // extract the important values from the response
          let status = monitor.status;
          let monitorId = monitor.id;

          logger.info(`For monitor ${monitorId}, got status: ${status}`);
          if (status != this.lastMonitors[monitorId]) {
            logger.info("This is a trigger, because previous monitor was: " +
              this.lastMonitors[monitorId]);
            triggered = true;
            if (status === -1) {
              color = '#FF0000';
              alerts.push(monitor.url + " is down!");
              logger.info("Sending alert on " + monitor.url + " is down");
            } else if (this.lastMonitors[monitorId] === -1) {
              alerts.push(monitor.url + " is back up.");
              logger.info("Sending alert on " + monitor.url + " is back up");
            }

            // FABIEN: the only way this code can run is if the previous
            // 'monitor is back up' message has also run. So this logic needs
            // to be moved to another place.
            // {
            // Add text when everything is working
            if(status===1){
              alerts.push(monitor.url + " is working");
              logger.info("Sending alert on " + monitor.url + " is working");
            }
            // }

            this.lastMonitors[monitorId] = status;
          }

          if (triggered) {
            let signal = new q.Signal({ 
              points:[[new q.Point(color)]],
              name: "Montastic Monitor",
              message: alerts.join("; "),
              link: {
                url: 'https://www.montastic.com/checkpoints',
                label: 'Show in Montastic',
              }
            });
            return signal;
          } else {
            return null;
          }
        }

      })
      .catch(error => {
        logger.error(
          `Got error sending request to service: ${JSON.stringify(error)}`);
        return q.Signal.error([
          'The Montastic service returned an error. Please check your API key and account.',
          `Detail: ${error.message}`]);
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