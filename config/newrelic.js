/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */

var env = 'development';
if( process.env.NODE_ENV != null){
  env = process.env.NODE_ENV;
}

exports.config = {
  /**
   * Array of application names.
   */
  app_name : ['APP NAME HERE - ' + env],
  /**
   * Your New Relic license key.
   */
  license_key : 'YOUR KEY HERE',
  logging : {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level    : 'info',
    filepath : process.cwd() + '/log/newrelic_agent.log',
  }
};
