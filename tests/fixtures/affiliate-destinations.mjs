// Synthetic resolver fixtures only. Never followed, published or used in deployment.
// Real campaign destinations belong exclusively to private server configuration.
export const testDestinations = Object.fromEntries(['brand', 'crash', 'live-casino', 'promo'].map(key =>
  ['betsson-br-' + key, 'https://record.betsson.bet.br/?fixture=' + key]))
