'use strict';

const elv = require('elv');


const msg = {
  deniedField: 'Black listed field encountered: ',
  invalidTarget: 'Invalid target encountered: ',
  nonallowedField: 'Non-white listed field encountered: ',
  requiredField: 'Missing required fields: ',
  convert: 'Invalid filter.  Unable to convert.',
};


class ConvertError extends Error {
  constructor(message) {
    super(elv.coalesce(message, msg.convert));
    this.name = 'ConvertError';
  }
  static get defaultMessage() { return msg.convert; }
}


class DeniedFieldError extends Error {
  constructor(field) {
    super(msg.deniedField + field);
    this.data = field;
    this.name = 'DeniedFieldError';
  }
  static get defaultMessage() { return msg.deniedField; }
}


class InvalidTargetError extends Error {
  constructor(target) {
    super(msg.invalidTarget + target.toJsonPointer());
    this.name = 'InvalidTargetError';
  }
  static get defaultMessage() { return msg.invalidTarget; }
}


class NonallowedFieldError extends Error {
  constructor(field) {
    super(msg.nonallowedField + field);
    this.data = field;
    this.name = 'NonallowedFieldError';
  }
  static get defaultMessage() { return msg.nonallowedField; }
}


class RequiredFieldError extends Error {
  constructor(fields) {
    super(msg.requiredField + JSON.stringify(fields));
    this.data = fields;
    this.name = 'RequiredFieldError';
  }
  static get defaultMessage() { return msg.requiredField; }
}


module.exports = {
  ConvertError,
  DeniedFieldError,
  InvalidTargetError,
  NonallowedFieldError,
  RequiredFieldError,
};
