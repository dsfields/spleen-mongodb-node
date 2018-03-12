'use strict';

const elv = require('elv');


const msg = {
  deniedField: 'Black listed field encountered: ',
  invalidTarget: 'Invalid target encountered: ',
  unallowedField: 'Non-white listed field encountered: ',
  requiredField: 'Missing required fields: ',
  convert: 'Invalid filter.  Unable to convert.',
  unsupported: 'Unsupported operation encountered',
};


/**
 * Thrown when an invalid Filter is encountered.
 *
 * @extends {Error}
 */
class ConvertError extends Error {
  constructor(message) {
    super(elv.coalesce(message, msg.convert));
    this.name = 'ConvertError';
  }
  static get defaultMessage() { return msg.convert; }
}


/**
 * Thrown when a Filter passed to convert() contains a black-listed field.
 *
 * @extends {Error}
 */
class DeniedFieldError extends Error {
  constructor(field) {
    super(msg.deniedField + field);
    this.data = field;
    this.name = 'DeniedFieldError';
  }
  static get defaultMessage() { return msg.deniedField; }
}


/**
 * Thrown when a Filter pass to convert() contains a target that contains
 * reserved MongoDB tokens.
 *
 * @extends {Error}
 */
class InvalidTargetError extends Error {
  constructor(target) {
    super(msg.invalidTarget + target.toJsonPointer());
    this.name = 'InvalidTargetError';
  }
  static get defaultMessage() { return msg.invalidTarget; }
}


/**
 * Thrown when a Filter passed to convert() contains a field that has not been
 * white-listed.
 *
 * @extends {Error}
 */
class UnallowedFieldError extends Error {
  constructor(field) {
    super(msg.unallowedField + field);
    this.data = field;
    this.name = 'UnallowedFieldError';
  }
  static get defaultMessage() { return msg.unallowedField; }
}


/**
 * Thrown when a Filter passed to convert() is missing required fields.
 *
 * @extends {Error}
 */
class RequiredFieldError extends Error {
  constructor(fields) {
    super(msg.requiredField + JSON.stringify(fields));
    this.data = fields;
    this.name = 'RequiredFieldError';
  }
  static get defaultMessage() { return msg.requiredField; }
}


/**
 * Thrown when a Filter passed to convert() a statement that cannot be converted
 * to a MongoDB Query Document.
 *
 * @extends {Error}
 */
class UnsupportedError extends Error {
  constructor(message) {
    super(elv.coalesce(message, msg.unsupported));
    this.name = 'UnsupportedError';
  }
  static get defaultMessage() { return msg.unsupported; }
}


module.exports = {
  ConvertError,
  DeniedFieldError,
  InvalidTargetError,
  RequiredFieldError,
  UnallowedFieldError,
  UnsupportedError,
};
