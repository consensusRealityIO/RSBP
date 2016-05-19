(function (RSBP_CONFIG, window) {

  "use strict";

  var getQueryStringValue = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results !== null){
      return results[1].replace('/','') || 0;
    } else {
      return null;
    }
  };

  var loadMerchantConfiguration = function () {
    var urlEnabled = RSBP_CONFIG.system.urlEnabled;
    var config = {
      "name": (urlEnabled ? getQueryStringValue("label") : RSBP_CONFIG.merchant.name) || "",
      "address": (urlEnabled ? getQueryStringValue("address") : RSBP_CONFIG.merchant.address) || "1E16XPFWKY2XaFDDzS6V93hGdXP2QEnddY",
      "currency": (urlEnabled ? getQueryStringValue("currency") : RSBP_CONFIG.merchant.currency) || "BTC",
      "defaultAmount": (urlEnabled ? getQueryStringValue("amount") : RSBP_CONFIG.merchant.defaultAmount) || 0,
      "discount": (urlEnabled ? getQueryStringValue("discount") : RSBP_CONFIG.merchant.discount) || 0
    };
    config.discount = config.discount / 100;
    return config;
  };

  RSBP_CONFIG.merchant = loadMerchantConfiguration();

}(RSBP_CONFIG, window));
