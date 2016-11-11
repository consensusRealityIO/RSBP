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
  const PAYEE_NAME = RSBP_CONFIG.payee.name;
  const CURRENCY = RSBP_CONFIG.payee.currency;
  const BTC_DECIMALS = 8;
  const CURRENCY_DECIMALS = (CURRENCY === "BTC") ? BTC_DECIMALS : 2;
  const DISCOUNT = RSBP_CONFIG.payee.discount / 100;
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

  let invoice = null;
  let initialBalance = null;
  let balance = null;
  let balanceStatus = null;

  let getAmount = function () {
    return ($("#currency-amount-input-field").val() * 1).toFixed(CURRENCY_DECIMALS);
  };

  let getDiscountAmount = function () {
    return (getAmount() * DISCOUNT).toFixed(CURRENCY_DECIMALS);
  };

  let getDiscountedAmount = function () {
    return (getAmount() * (1 - DISCOUNT)).toFixed(CURRENCY_DECIMALS);
  };

  let getDiscountedAmountBtc = function () {
    return (getDiscountedAmount() / RSBP.getRate()).toFixed(BTC_DECIMALS);
  };

  let getBitcoinUri = function (invoiceId) {
    return "bitcoin:" + ADDRESS + "?" +
      "amount=" + getDiscountedAmountBtc() +
      "&message=invoice" + invoiceId +
      "&label=" + PAYEE_NAME;
  };

  let updateTitle = function () {
    let text = "Invoice " + invoice.id;
    $("#payment-modal-title").text(text);
  };

  let updateAmount = function () {
    let value = invoice.amount.toLocaleString() + " " + invoice.currency;
    $("#payment-modal-amount-value").text(value);
  };

  let updateDiscount = function () {
    let text = "Discount " + invoice.discount.toLocaleString() + "%:";
    let value = invoice.discountAmount.toLocaleString() + " " + invoice.currency;
    $("#payment-modal-discount-text").text(text);
    $("#payment-modal-discount-value").text(value);
  };

  let updateTotal = function () {
    let valueCcy = invoice.discountedAmount.toLocaleString() + " " + invoice.currency;
    $("#payment-modal-total-value-currency").text(valueCcy);
    if (invoice.currency !== "BTC") {
      let valueBtc = invoice.discountedAmountBtc.toLocaleString() + " BTC";
      $("#payment-modal-total-value-btc").text(valueBtc);
    }
  };

  let updateRate = function () {
    if (invoice.currency === "BTC") {
      $("#payment-modal-rate-tr").remove();
    } else {
      let value = "1 BTC = " + invoice.exchangeRate.toLocaleString() + " BTC";
      $("#payment-modal-rate-value").text(value);
    }
  };

  let updateQrCode = function () {
    $("#payment-modal-qrcode").html(""); // reset
    $("#payment-modal-qrcode").qrcode(invoice.bitcoinUri);
  };

  let createInvoice = function (invoiceId) {
    return {
      id: invoiceId,
      payeeName: PAYEE_NAME,
      address: ADDRESS,
      currency: CURRENCY,
      amount: getAmount(),
      discount: DISCOUNT,
      discountAmount: getDiscountAmount(),
      discountedAmount: getDiscountedAmount(),
      discountedAmountBtc: getDiscountedAmountBtc(),
      exchangeRate: RSBP.getRate(),
      bitcoinUri: getBitcoinUri(invoiceId),
      paid: false
    };
  };

  let updateInvoice = function () {
    let invoiceId = Math.floor(Math.random() * (900000 - 100000 + 1)) + 100000;
    invoice = createInvoice(invoiceId);
    console.info("Created invoice " + invoiceId + ": " + JSON.stringify(invoice));
    updateTitle();
    updateAmount();
    updateDiscount();
    updateTotal();
    updateRate();
    updateQrCode();
  };

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
    if (invoice !== null && retrieveBalanceInterval === null) {
      console.info("Starting balance retrieval...");
      retrieveBalance();
      retrieveBalanceInterval = window.setInterval(retrieveBalance, 5 * 1000);
    }
  };

  let stopBalanceRetrieval = function () {
    if (invoice === null || retrieveBalanceInterval !== null) {
      console.info("Stopping balance retrieval...");
      window.clearInterval(retrieveBalanceInterval);
      retrieveBalanceInterval = null;
    }
  };

  let validateBalance = function () {
    console.info("Validating balance...");
    if (invoice !== null) {
      if (initialBalance !== null) {
        let diff = initialBalance - balance;
        if (diff > 0) {
          console.info("Address balance changed by " + (initialBalance - balance) + " satoshi");
          let discountedAmountSatoshi = invoice.discountedAmountBtc * Math.pow(10, 8);
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
    // Modal controller
    $("#payment-modal").on("hidden.bs.modal", function () {
      invoice = null;
    });
    $("#pay-button").click(function () {
      updateInvoice();
      updateStatus();
      console.info("Showing payment modal...");
      $("#payment-modal").modal("show");
    });

    // Status controller
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
