/* global console */
/* global window */
/* global document */
/* global Event */
/* global $ */
/* global RSBP_CONFIG */
/* global RSBP */

(function () {

  "use strict";

  const ADDRESS = RSBP_CONFIG.payee.address;
  const BALANCE_RECEIVED_EVENT = new Event("balance-received");
  const BALANCE_STATUS_UPDATE_EVENT = new Event("balance-status-update");
  const BALANCE_STATUS = {
    INITIALIZING: 0,
    WAITING: 1,
    RESET: 2,
    PAID: 3,
    toString: function (index) {
      switch (index) {
      case 0:
        return "INITIALIZING";
      case 1:
        return "WAITING";
      case 2:
        return "RESET";
      case 3:
        return "PAID";
      default:
        return null;
      }
    }
  };

  let initialBalance = null;
  let balance = null;
  let balanceStatus = null;

  let updateStatus = function () {
    $("#payment-status-div").removeClass("alert-danger");
    $("#payment-status-div").removeClass("alert-warning");
    $("#payment-status-div").removeClass("alert-info");
    $("#payment-status-div").removeClass("alert-success");
    $("#payment-status-icon").removeClass("glyphicon-exclamation-sign");
    $("#payment-status-icon").removeClass("glyphicon-refresh");
    $("#payment-status-icon").removeClass("glyphicon-refresh-animate");
    $("#payment-status-text").text("");
    if (!RSBP.isOnline()) {
      $("#payment-status-div").addClass("alert-danger");
      $("#payment-status-icon").addClass("glyphicon-exclamation-sign");
      $("#payment-status-text").text("Disconnected. Reconnecting...");
    } else if (balanceStatus === BALANCE_STATUS.INITIALIZING) {
      $("#payment-status-div").addClass("alert-info");
      $("#payment-status-icon").addClass("glyphicon-refresh");
      $("#payment-status-icon").addClass("glyphicon-refresh-animate");
      $("#payment-status-text").text("Retrieving initial address balance...");
    } else if (balanceStatus === BALANCE_STATUS.WAITING) {
      $("#payment-status-div").addClass("alert-info");
      $("#payment-status-icon").addClass("glyphicon-refresh");
      $("#payment-status-icon").addClass("glyphicon-refresh-animate");
      $("#payment-status-text").text("Waiting for payment");
    } else if (balanceStatus === BALANCE_STATUS.RESET) {
      $("#payment-status-div").addClass("alert-warning");
      $("#payment-status-icon").addClass("glyphicon-exclamation-sign");
      $("#payment-status-text").text("Another payment has been received. Waiting for payment...");
    } else if (balanceStatus === BALANCE_STATUS.PAID) {
      $("#payment-status-div").addClass("alert-success");
      $("#payment-status-text").text("Payment received!");
    }
  };

  let retrieveBalance = function () {
    console.info("Retrieving balance...");
    let uri = "https://blockchain.info/q/addressbalance/" + ADDRESS;
    let jQXhr = RSBP.ajax(uri, false);
    jQXhr.done(function (data) {
      if (initialBalance === null) {
        console.info("Initial balance retrieved: " + data + " satoshi");
        initialBalance = data;
      } else {
        console.info("Balance retrieved: " + data + " satoshi");
      }
      balance = data;
      window.dispatchEvent(BALANCE_RECEIVED_EVENT);
    });
    jQXhr.fail(function (jQXhr, status) {
      console.error("Balance retrieval failed with error status " + status);
    });
  };

  let retrieveBalanceInterval = null;

  let startBalanceRetrieval = function () {
    if (RSBP.getInvoice() !== null && retrieveBalanceInterval === null) {
      console.info("Starting balance retrieval...");
      retrieveBalance();
      retrieveBalanceInterval = window.setInterval(retrieveBalance, 5 * 1000);
    }
  };

  let stopBalanceRetrieval = function () {
    if (RSBP.getInvoice() === null || retrieveBalanceInterval !== null) {
      console.info("Stopping balance retrieval...");
      window.clearInterval(retrieveBalanceInterval);
      retrieveBalanceInterval = null;
    }
  };

  let validateBalance = function () {
    console.info("Validating balance...");
    if (RSBP.getInvoice() !== null) {
      if (initialBalance !== null) {
        let diff = initialBalance - balance;
        if (diff > 0) {
          console.info("Address balance changed by " + (initialBalance - balance) + " satoshi");
          let discountedAmountSatoshi = RSBP.getInvoice().discountedAmountBtc * Math.pow(10, 8);
          console.info("Invoice amount: " + discountedAmountSatoshi + " satoshi");
          if (initialBalance - balance == discountedAmountSatoshi) {
            console.info("Balance difference matches invoice amount. Assuming the payment went through...");
            balanceStatus = BALANCE_STATUS.PAID;
          } else {
            console.info("Balance difference does not match invoice amount. Keep waiting...");
            initialBalance = balance;
            balanceStatus = BALANCE_STATUS.RESET;
          }
        } else {
          balanceStatus = BALANCE_STATUS.WAITING;
        }
      } else {
        balanceStatus = BALANCE_STATUS.INITIALIZING;
      }
      console.info("Balance status: " + BALANCE_STATUS.toString(balanceStatus));
      window.dispatchEvent(BALANCE_STATUS_UPDATE_EVENT);
    }
  };

  $(document).ready(function () {
    // Status controller
    $("#payment-modal").on("show.bs.modal", function () {
      updateStatus();
    });
    window.addEventListener("connectivity", updateStatus);

    // Balance controller
    $("#payment-modal").on("shown.bs.modal", function () {
      initialBalance = null;
      balanceStatus = null;
      validateBalance();
      startBalanceRetrieval();
    });
    $("#payment-modal").on("hidden.bs.modal", function () {
      initialBalance = null;
      balanceStatus = null;
      stopBalanceRetrieval();
    });
    window.addEventListener("connectivity", function () {
      if (RSBP.isOnline()) {
        startBalanceRetrieval();
      } else {
        stopBalanceRetrieval();
      }
    });

    // Balance validation
    window.addEventListener("balance-received", validateBalance);
    window.addEventListener("balance-status-update", updateStatus);
  });
}());
