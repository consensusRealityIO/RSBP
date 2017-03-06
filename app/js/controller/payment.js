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
  const BALANCE_STATUS_UPDATE_EVENT = new Event("balance-status-update");
  const BALANCE_STATUS = {
    WAITING: 0,
    PAID: 1,
    PAID_RBF: 2,
    PAID_LOW_FEE: 3,
    toString: function (index) {
      switch (index) {
      case 0:
        return "WAITING";
      case 1:
        return "PAID";
      case 2:
        return "PAID_RBF";
      case 3:
        return "PAID_LOW_FEE";
      default:
        return null;
      }
    }
  };

  let balanceStatus = null;
  let recommendedFeePerByte = 0;
  let txLink = "#";

  let updateStatus = function () {
    $("#payment-status-div").removeClass("alert-danger");
    $("#payment-status-div").removeClass("alert-warning");
    $("#payment-status-div").removeClass("alert-info");
    $("#payment-status-div").removeClass("alert-success");
    $("#payment-status-icon").removeClass("glyphicon-exclamation-sign");
    $("#payment-status-icon").removeClass("glyphicon-refresh");
    $("#payment-status-icon").removeClass("glyphicon-refresh-animate");
    $("#payment-status-text").text("");
    $("#payment-status-link").parent().hide();
    if (!RSBP.connector.isOnline()) {
      $("#payment-status-div").addClass("alert-danger");
      $("#payment-status-icon").addClass("glyphicon-exclamation-sign");
      $("#payment-status-text").text("Disconnected. Reconnecting...");
    } else if (balanceStatus === BALANCE_STATUS.WAITING) {
      $("#payment-status-div").addClass("alert-info");
      $("#payment-status-icon").addClass("glyphicon-refresh");
      $("#payment-status-icon").addClass("glyphicon-refresh-animate");
      $("#payment-status-text").text("Waiting for payment");
    } else if (balanceStatus === BALANCE_STATUS.PAID) {
      $("#payment-status-div").addClass("alert-success");
      $("#payment-status-text").text("Payment Success!");
    } else if (balanceStatus === BALANCE_STATUS.PAID_RBF) {
      $("#payment-status-div").addClass("alert-warning");
      $("#payment-status-text").text("WARNING! Replace By Fee - Please wait for 1 confirmation.");
      $("#payment-status-link").prop("href", txLink).parent().show();
    } else if (balanceStatus === BALANCE_STATUS.PAID_LOW_FEE) {
      $("#payment-status-div").addClass("alert-warning");
      $("#payment-status-text").text("WARNING! Low Fee Detected - Please wait for 1 confirmation.");
      $("#payment-status-link").prop("href", txLink).parent().show();
    }
  };

  let retrieveBalance = function () {
    console.info("Retrieving address balance...");

    RSBP.connector.ajax(
      "https://insight.bitpay.com/api/utils/estimatefee?nbBlocks=6"
    )
    .done(function (json) {
      recommendedFeePerByte = json["2"] / 1000;
      console.info("Recommended fee set to " + recommendedFeePerByte);
    })
    .fail(function (jQXhr, status) {
      console.error("Fee retrieval failed with error status " + status);
    });

    RSBP.connector.ajax(
      "https://insight.bitpay.com/api/txs/?address=" + ADDRESS
    )
    .done(function (json) {
      let invoice = RSBP.invoice.get();
      if (invoice === null) {
        return;
      }

      let lastTx = json.txs[0]; // most recent tx is first element

      if (!lastTx) {
        console.info("No transactions for this address yet");
        return;
      }

      txLink = "https://insight.bitpay.com/tx/" + lastTx.txid;

      if (lastTx.time < invoice.time) {
        console.debug("Found past transaction, ignoring it");
        return;
      }

      let validAmount = false;
      let outputs = lastTx.vout;

      outputs.forEach(function (output) {
        if (output.scriptPubKey.addresses[0] == ADDRESS &&
            output.value == invoice.discountedAmountBtc) {
          validAmount = true;
        }
      });

      if (validAmount) {
        console.info("Found valid amount");

        if (isRBF(lastTx) && lastTx.confirmations < 1) {
          balanceStatus = BALANCE_STATUS.PAID_RBF;
        } else if (isLowFee(lastTx) && lastTx.confirmations < 1) {
          balanceStatus = BALANCE_STATUS.PAID_LOW_FEE;
        } else {
          stopBalanceRetrieval();
          balanceStatus = BALANCE_STATUS.PAID;
        }
      } else {
        console.info("Keep waiting...");
      }

      console.info("Balance status: " + BALANCE_STATUS.toString(balanceStatus));
      window.dispatchEvent(BALANCE_STATUS_UPDATE_EVENT);
    })
    .fail(function (jQXhr, status) {
      console.error("Balance retrieval failed with error status " + status);
    });
  };

  let retrieveBalanceInterval = null;

  let startBalanceRetrieval = function () {
    if (RSBP.invoice.get() !== null && retrieveBalanceInterval === null) {
      console.info("Starting balance retrieval...");
      updateStatus();
      retrieveBalance();
      retrieveBalanceInterval = window.setInterval(retrieveBalance, 5 * 1000);
    }
  };

  let stopBalanceRetrieval = function () {
    if (RSBP.invoice.get() === null || retrieveBalanceInterval !== null) {
      console.info("Stopping balance retrieval...");
      window.clearInterval(retrieveBalanceInterval);
      retrieveBalanceInterval = null;
      updateStatus();
    }
  };

  let isRBF = function (tx) {
    let maxInt = 0xffffffff;
    let inputs = tx.vin;
    let rbf = false;

    inputs.forEach(function (input) {
      if (input.sequence < maxInt) {
        console.info("RBF transaction detected");
        rbf = true;
      }
    });

    return rbf;
  };

  let isLowFee = function (tx) {
    let paidFee = tx.fees;
    let recommendedFeeForTx = recommendedFeePerByte * tx.size;
    let lowFee = paidFee < recommendedFeeForTx;

    if (lowFee) {
      console.info("Low-fee transaction detected " +
                   "(" + paidFee + " < " + recommendedFeeForTx + ")");
    }

    return lowFee;
  };

  $(document).ready(function () {
    // Status controller
    $("#payment-modal").on("show.bs.modal", function () {
      updateStatus();
    });
    window.addEventListener("connectivity", updateStatus);

    // Balance controller
    $("#payment-modal").on("shown.bs.modal", function () {
      balanceStatus = BALANCE_STATUS.WAITING;
      startBalanceRetrieval();
    });
    $("#payment-modal").on("hidden.bs.modal", function () {
      balanceStatus = null;
      stopBalanceRetrieval();
    });
    window.addEventListener("connectivity", function () {
      if (RSBP.connector.isOnline()) {
        startBalanceRetrieval();
      } else {
        stopBalanceRetrieval();
      }
    });

    // Balance validation
    window.addEventListener("balance-status-update", updateStatus);
  });
}());
