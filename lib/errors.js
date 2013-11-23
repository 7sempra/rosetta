var classdef = require('classdef');

var RosettaError = exports.RosettaError = classdef(Error, {
  name: 'RosettaError',

  constructor: function(message) {
    Error.call(this);
    Error.captureStackTrace(this, RosettaError);
    this.message = message;
  }
});

var CompileError = exports.CompileError = classdef(RosettaError, {
  name: 'CompileError',

  constructor: function(type, message, token) {
    RosettaError.call(this, message);

    this.type = type;
    this.token = token;
  }
});