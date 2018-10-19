const q = require('daskeyboard-applet');
const request = require('request-promise');

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

    this.serviceHeaders = {
      "Content-Type": "application/json",
      "X-API-KEY": this.authorization.apiKey,
    }

    this.lastMonitors = {};
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

          console.log(`For monitor ${monitorId}, got status: ${status}`);
          if (status != this.lastMonitors[monitorId]) {
            console.log("This is a trigger, because previous monitor was: " +
              this.lastMonitors[monitorId]);
            triggered = true;
            if (status === -1) {
              color = '#FF0000';
              alerts.push(monitor.name + " is down!");
              console.log("Sending alert on " + monitor.name + " is down");
            } else if (this.lastMonitors[monitorId] === -1) {
              alerts.push(monitor.name + " is back up.");
              console.log("Sending alert on " + monitor.name + " is back up");
            }
            this.lastMonitors[monitorId] = status;
          }

          if (triggered) {
            let signal = new q.Signal({ 
              points:[[new q.Point(color)]],
              name: "Montastic Monitor",
              message: alerts.join("; ")
            });

            return signal;
          } else {
            return null;
          }
        }

      })
      .catch(function (error) {
        console.error("Got error sending request to service:", error);
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