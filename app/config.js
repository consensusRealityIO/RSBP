let RSBP_CONFIG = { // eslint-disable-line no-unused-vars
  "system": {
    "urlConfig": false, // if 'true', load the the configuration from the URL
                        // query string, else load it from RSBP_CONFIG.payee
  },
  "connector": {
    "timeout": 2000, // in milliseconds
    "reconnectInterval": 1000, // in milliseconds
    "corsProxy": "https://crossorigin.me/"
  },
  "rate": {
    "useCorsProxy": false,
    "expiration": 2 * 60 * 1000 // in milliseconds
  },
  "payee": {
    "name": "consensusReality",
    "address": "1E16XPFWKY2XaFDDzS6V93hGdXP2QEnddY",
    "currency": "IDR",
    "discount": 0 // in percent
  }
};
