var classdef = require('classdef');

var ParseError = exports.ParseError = classdef(Error, {
  name: 'ParseError',

  constructor: function(message, token) {
    Error.call(this);
    Error.captureStackTrace(this, ParseError);
    this.message = message;
    this.token = token;
  }
});

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