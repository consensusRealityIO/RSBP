/* global window */
/* global console */
/* global Event */
/* global RSBP_CONFIG */
/* global RSBP */

(function () {

  "use strict";

  let CURRENCY = RSBP_CONFIG.payee.currency;
  let DISCOUNT = RSBP_CONFIG.payee.discount;
  let USE_CORS_PROXY = RSBP_CONFIG.rate.useCorsProxy;
  let EXPIRATION = RSBP_CONFIG.rate.expiration;
  let IS_BTC = CURRENCY === "BTC";
  let URL = "https://api.bitcoinaverage.com/ticker/" + CURRENCY + "/last";

  let rate = 1;
  let rateReceivedTime = null;
  let rateEvent = new Event("rate");
  let lastValidation = false;
  let started = false;

  let isRateValid = function () {
    return IS_BTC ||
      (rateReceivedTime !== null && Math.abs(Date.now() - rateReceivedTime) <= EXPIRATION);
  };

  let getRate = function () {
    return isRateValid() ? rate : null;
  };

  let fetchRate = function () {
    console.info("Sending conversion rate request to " + URL);
    let jQXhr = RSBP.ajax(URL, USE_CORS_PROXY);
    jQXhr.done(function (data) {
      console.info("Conversion rate received: " + data + " " + CURRENCY + "/BTC");
      rate = data * (1 + (DISCOUNT / 100));
      console.info("Conversion rate with discount of " + DISCOUNT + "%: " + rate + " " + CURRENCY + "/BTC");
      rateReceivedTime = Date.now();
      window.dispatchEvent(rateEvent);
    });
    jQXhr.fail(function (jQXhr, status) {
      console.error("Conversion rate request failed with status " + status);
    });
  };

  let fetchRateInterval = null;

  let validateRate = function () {
    if (isRateValid()) {
      if (!lastValidation) {
        console.info("Rate is now valid");
        lastValidation = true;
        window.dispatchEvent(rateEvent);
      }
    } else {
      if (lastValidation) {
        console.info("Rate is now invalid");
        lastValidation = false;
        window.dispatchEvent(rateEvent);
      }
    }
  };

  let validateRateInterval = null; // eslint-disable-line no-unused-vars

  let start = function () {
    if (!started) {
      console.info("Starting rate connector...");
      fetchRate();
      fetchRateInterval = window.setInterval(fetchRate, EXPIRATION / 2);
      validateRate();
      validateRateInterval = window.setInterval(validateRate, EXPIRATION / 2);
      started = true;
    }
  };

  let stop = function () {
    if (started) {
      console.info("Stopping rate connector...");
      window.clearInterval(fetchRateInterval);
      // we don't clear validateRateInterval, as the rate may be valid even if
      // the system is offline
      started = false;
    }
  };

  if (!IS_BTC) {
    if (RSBP.isOnline()) {
      start();
    }
    window.addEventListener("connectivity", function () {
      if (RSBP.isOnline()) {
        start();
      } else {
        stop();
      }
    });
  }

  RSBP.isRateValid = isRateValid;
  RSBP.getRate = getRate;

}());
