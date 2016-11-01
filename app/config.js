var RSBP_CONFIG = {
  "system": {
    "urlConfig": false, // if 'true', load the the configuration from the URL
                       // query string, else load it from RSBP_CONFIG.payee
  },
  "connector": {
    "timeout": 2000, // in milliseconds
    "reconnectInterval": 1000, // in milliseconds
    "corsProxy": "https://crossorigin.me/"
  },
  "payee": {
    "name": "consensusReality",
    "address": "1E16XPFWKY2XaFDDzS6V93hGdXP2QEnddY",
    "currency": "IDR",
    "discount": 0 // in percent
  }
};
