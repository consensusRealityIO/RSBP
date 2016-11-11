/* global window */
/* global console */
/* global Event */
/* global RSBP_CONFIG */
/* global RSBP */

(function () {

  "use strict";

  const CURRENCY = RSBP_CONFIG.payee.currency;
  const USE_CORS_PROXY = RSBP_CONFIG.rate.useCorsProxy;
  const EXPIRATION = RSBP_CONFIG.rate.expiration;
  const IS_BTC = CURRENCY === "BTC";
  const URL = "https://api.bitcoinaverage.com/ticker/" + CURRENCY + "/last";
  const RATE_EVENT = new Event("rate");

  let rate = 1;
  let rateReceivedTime = null;
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
      console.info("Conversion rate received: 1 BTC = " + data + " " + CURRENCY);
      rate = data;
      rateReceivedTime = Date.now();
      window.dispatchEvent(RATE_EVENT);
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
        window.dispatchEvent(RATE_EVENT);
      }
    } else {
      if (lastValidation) {
        console.info("Rate is now invalid");
        lastValidation = false;
        window.dispatchEvent(RATE_EVENT);
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
