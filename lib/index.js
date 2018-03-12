'use strict';

const convert = require('./convert');
const errors = require('./errors');
const Strategy = require('./strategy');


/**
 * @module splongo
 */
module.exports = {
  /**
   * @method convert
   * Converts a spleen.Filter instance into a MongoDB Query Document.
   *
   * @param {object} filter - The filter to convert.
   * @param {Strategy} [strategy] - An instance of Strategy used to control version behavior.
   */
  convert,
  errors,
  Strategy,
};
