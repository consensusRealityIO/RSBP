/* global window */
/* global RSBP_CONFIG */

(function () {

  "use strict";

  let getQueryStringValue = function (name) {
    let results = new RegExp("[\?&]" + name + "=([^&#]*)").exec(window.location.href);
    if (results !== null){
      return results[1].replace("/", "") || 0;
    } else {
      return null;
    }
  };

  let loadMerchantConfiguration = function () {
    let urlConfig = RSBP_CONFIG.system.urlConfig;
    let config = {
      "name": (urlConfig ? getQueryStringValue("name") : RSBP_CONFIG.payee.name) || "consensusReality",
      "address": (urlConfig ? getQueryStringValue("address") : RSBP_CONFIG.payee.address) || "1E16XPFWKY2XaFDDzS6V93hGdXP2QEnddY",
      "currency": (urlConfig ? getQueryStringValue("currency") : RSBP_CONFIG.payee.currency) || "BTC",
      "amount": (urlConfig ? getQueryStringValue("amount") : "") || "",
      "discount": (urlConfig ? getQueryStringValue("discount") : RSBP_CONFIG.payee.discount) || 0
    };
    config.discount = config.discount / 100;
    return config;
  };

  RSBP_CONFIG.payee = loadMerchantConfiguration();

}());
