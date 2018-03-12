const elv = require('elv');

const errors = require('./errors');


//
// ERROR MESSAGES
//


const msg = {
  argAllow: 'Argument "options.allow" must be an array',
  argAllowDeny: 'Argument "options" cannot contain both allow and deny',
  argDeny: 'Argument "options.deny" must be an array',
  argOpts: 'Argument "options" must be an object',
  argReqFields: 'Argument "options.require.fields" must be an array',
  argRequire: 'Argument "options.require" must be an object',
  argWhich: 'Argument "options.require.which" must be "any" or "all"',
};


//
// CONSTANTS
//


const ALL = 'all';
const ANY = 'any';


//
// STRATEGY CLASS
//


/**
 * @typedef {object} StrategyOptions
 * Optional data used to control spleen.Filter conversion behavior.
 *
 * @prop {string[]} [allow]
 * @prop {string[]} [deny]
 * @prop {object} [require]
 * @prop {string[]} [require.fields]
 * @prop {'any'|'all'} which=any
 */


/**
 * A class that represents a conversion strategy.  Instances are meant to be
 * cached in memory to prevent having to recompute this information with every
 * call to convert().
*/
class Strategy {

  /**
   * Creates a new instance of Strategy.
   *
   * @param {StrategyOptions} [options]
   */
  constructor(options) {
    this._list = [];
    this._isBlackList = false;
    this._require = [];
    this._requireAll = false;

    const opts = elv.coalesce(options, {});

    if (typeof opts !== 'object') {
      throw new TypeError(msg.argOpts);
    }

    const allow = elv.coalesce(opts.allow, []);
    const deny = elv.coalesce(opts.deny, []);

    if (!Array.isArray(allow)) {
      throw new TypeError(msg.argAllow);
    }

    if (!Array.isArray(deny)) {
      throw new TypeError(msg.argDeny);
    }

    if (allow.length > 0 && deny.length > 0) {
      throw new TypeError(msg.argAllowDeny);
    }

    if (allow.length > 0) {
      this._list = allow;
    } else if (deny.length > 0) {
      this._list = deny;
      this._isBlackList = true;
    }

    const require = elv.coalesce(opts.require, {});

    if (typeof require !== 'object') {
      throw new TypeError(msg.argRequire);
    }

    const requireFields = elv.coalesce(require.fields, []);

    if (!Array.isArray(requireFields)) {
      throw new TypeError(msg.argReqFields);
    }

    this._require = requireFields;

    const which = elv.coalesce(require.which, ANY);

    if (which !== ANY && which !== ALL) {
      throw new TypeError(msg.argWhich);
    }

    this._requireAll = which === ALL;
  }


  /** @private */
  assertAllowed(target) {
    if (this._list.length === 0) return;
    const exists = this._list.indexOf(target.field) > -1;

    if (this._isBlackList) {
      if (exists) throw new errors.DeniedFieldError(target);
      return;
    }

    if (!exists) {
      throw new errors.UnallowedFieldError(target);
    }
  }


  /** @private */
  assertMeetsRequired(fields) {
    if (this._require.length === 0) return;

    const met = (this._requireAll)
      ? this._allRequired(fields)
      : this._anyRequired(fields);

    if (!met) throw new errors.RequiredFieldError(this._require, this._requireAll);
  }


  /** @private */
  _anyRequired(fields) {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (this._require.indexOf(field) > -1) return true;
    }
    return false;
  }


  /** @private */
  _allRequired(fields) {
    for (let i = 0; i < this._require.length; i++) {
      const field = this._require[i];
      if (fields.indexOf(field) === -1) return false;
    }
    return true;
  }

}


module.exports = Strategy;
