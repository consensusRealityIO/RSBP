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
  const URL = "https://apiv2.bitcoinaverage.com/indices/global/ticker/BTC" + CURRENCY +"";
  const RATE_EVENT = new Event("rate");

  let rate = 1;
  let rateReceivedTime = null;
  let lastValid = null;
  let enabled = false;

  let isValid = function () {
    return IS_BTC ||
      (rateReceivedTime !== null && Math.abs(Date.now() - rateReceivedTime) <= EXPIRATION);
  };

  let get = function () {
    return isValid() ? rate : null;
  };

  let fetch = function () {
    console.info("Sending exchange rate request to " + URL);
    let jQXhr = RSBP.connector.ajax(URL, USE_CORS_PROXY);
    jQXhr.done(function (data) {
      data = data["last"];
      console.info("Exchange rate received: 1 BTC = " + data + " " + CURRENCY);
      rate = data;
      rateReceivedTime = Date.now();
      window.dispatchEvent(RATE_EVENT);
    });
    jQXhr.fail(function (jQXhr, status) {
      console.error("Exchange rate request failed with status " + status);
    });
  };

  let fetchInterval = null;

  let validate = function () {
    if (isValid()) {
      console.info("Exchange rate is valid");
      if (lastValid === null || !lastValid) {
        lastValid = true;
        window.dispatchEvent(RATE_EVENT);
      }
    } else {
      console.info("Exchange rate is invalid");
      if (lastValid !== null && lastValid) {
        lastValid = false;
        window.dispatchEvent(RATE_EVENT);
      }
    }
  };

  let validateInterval = null; // eslint-disable-line no-unused-vars

  let enable = function () {
    if (!enabled) {
      console.info("Enabling exchange rate service...");
      fetch();
      fetchInterval = window.setInterval(fetch, EXPIRATION / 2);
      validate();
      validateInterval = window.setInterval(validate, EXPIRATION / 2);
      enabled = true;
    }
  };

  let disable = function () {
    if (enabled) {
      console.info("Disabling exchange rate service...");
      window.clearInterval(fetchInterval);
      // we don't clear validateInterval, as the rate may be valid even if
      // the system is disabled
      enabled = false;
    }
  };

  let start = function () {
    console.info("Starting exchange rate service...");
    if (!IS_BTC) {
      if (RSBP.connector.isOnline()) {
        enable();
      }
      window.addEventListener("connectivity", function () {
        if (RSBP.connector.isOnline()) {
          enable();
        } else {
          disable();
        }
      });
    } else {
      console.info("Exchange rate is valid and fixed at 1 BTC = 1 BTC");
    }
    console.info("Exchange rate service started");
  };

  RSBP.rate = {
    start: start,
    isValid: isValid,
    get: get
  };

}());
