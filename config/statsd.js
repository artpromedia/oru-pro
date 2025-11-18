/*
 * Lightweight StatsD configuration used for local development.
 * This routes metrics to the console (for visibility) and exposes
 * the default UDP listener on 8125 plus the management interface on 8126.
 */
module.exports = {
  port: 8125,
  mgmt_port: 8126,
  backends: ["./backends/console"],
  deleteGauges: false,
  deleteTimers: false,
  deleteSets: false,
  deleteCounters: false,
  debug: false
};
