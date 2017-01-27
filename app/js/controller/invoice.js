/* global console */
/* global document */
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
  const DISCOUNT = RSBP_CONFIG.payee.discount;

  let invoice = null;

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
    return (getDiscountedAmount() / RSBP.rate.get()).toFixed(BTC_DECIMALS);
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
    let text = (invoice.discount * 100).toLocaleString() + "% discount:";
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
      let value = "1 BTC = " + invoice.exchangeRate.toLocaleString() + " " + CURRENCY;
      $("#payment-modal-rate-value").text(value);
    }
  };

  let updateAddress = function () {
    $("#payment-modal-address").text(invoice.address);
    $("#payment-modal-address").prop("href", invoice.bitcoinUri);
  };

  let updateQrCode = function () {
    $("#payment-modal-qrcode").html(""); // reset
    $("#payment-modal-qrcode").qrcode(invoice.bitcoinUri);
  };

  let createInvoice = function (invoiceId) {
    let now = Date.now() / 1000;

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
      exchangeRate: RSBP.rate.get(),
      bitcoinUri: getBitcoinUri(invoiceId),
      time: now
    };
  };

  let update = function () {
    let invoiceId = Math.floor(Math.random() * (900000 - 100000 + 1)) + 100000;
    invoice = createInvoice(invoiceId);
    console.info("Created invoice " + invoiceId + ": " + JSON.stringify(invoice));
    updateTitle();
    updateAmount();
    updateDiscount();
    updateTotal();
    updateRate();
    updateAddress();
    updateQrCode();
  };

  let get = function () {
    return invoice;
  };

  RSBP.invoice = {
    get: get
  };

  $(document).ready(function () {
    console.info("Initializing invoice controller...");
    $("#payment-modal").on("show.bs.modal", function () {
      update();
    });
    $("#payment-modal").on("hidden.bs.modal", function () {
      invoice = null;
    });
    console.info("Invoice controller initialized");
  });
}());
