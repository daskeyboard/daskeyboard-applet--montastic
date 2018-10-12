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

  }
  /** ping Montastic and set the signal  */
  async run() {
    return request.get({
        url: serviceUrl,
        headers: this.serviceHeaders,
        json: true
      }).then((body) => {
        let points = null;
        if (this.config.monitors) {
          points = new Array(this.config.monitors.length);
        } else {
          points = [];
        }

        for (let monitor of body) {
          // extract the important values from the response
          let status = monitor.status;
          let monitorId = monitor.id;

          console.log(`For monitor ${monitorId}, got status: ${status}`);

          let point = new q.Point(responseColors[status],
            responseEffects[status]);
          if (this.config.monitors) {
            let i = this.config.monitors.indexOf(monitorId);
            if (i >= 0) {
              console.log(`Adding point at index ${i}: ${JSON.stringify(point)}`);
              points[i] = point;
            }
          } else {
            console.log(`Pushing point: ${JSON.stringify(point)}`);
            points.push(point);
          }
        }

        return new q.Signal([points]);
      })
      .catch(function (error) {
        console.error("Got error sending request to service:", error);
      });
  }
}


const montastic = new QMontastic();
montastic.start();