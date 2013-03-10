var classdef = require('classdef');

var CompileError = exports.CompileError = classdef(Error, {
  name: 'CompileError',

  constructor: function(type, message, token) {
    Error.call(this);
    Error.captureStackTrace(this, CompileError);
    this.type = type;
    this.message = message;
    this.token = token;
  }
});

var RosettaError = exports.RosettaError = classdef(Error, {
  name: 'RosettaError',

  constructor: function(message) {
    Error.call(this);
    Error.captureStackTrace(this, RosettaError);
    this.message = message;
  }
});