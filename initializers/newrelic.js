exports.newrelic = function(api, next){

  api.newrelic = {};

  if(api.env === 'production'){

    newrelic = require("newrelic");

    api.newrelic.middleware = function(connection, actionTemplate, next){
      if(connection.type === 'web'){
        // for now, the node newrelic agent only supports HTTP requests
        newrelic.setTransactionName(actionTemplate.name);
      }
      next(connection, true);
    }

    api.newrelic.errorReporter = function(type, err, extraMessages, severity){
      newrelic.noticeError(err);
    }

    api.newrelic._start = function(api, next){
      // load the newrelic middleware into actionhero
      api.actions.preProcessors.push( api.newrelic.middleware );
      // load the newrelic error reporter into actionhero
      api.exceptionHandlers.reporters.push( api.newrelic.errorReporter );
      // optional: ignore certain actions
      // newrelic.setIgnoreTransaction('actionName');
      next();
    };

    api.newrelic._stop =  function(api, next){
      next();
    };

  }

  next();
}