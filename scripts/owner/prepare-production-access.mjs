// Production already has its permanent credential. Retire the bootstrap command
// so running old setup instructions cannot generate or export another password.
console.error('PlayLiva owner access is already provisioned. Keep the existing secure production secret. Only the owner may intentionally change it; no credential was generated or written.')
process.exitCode = 1
