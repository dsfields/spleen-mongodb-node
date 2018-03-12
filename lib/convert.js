'use strict';

const {
  Clause,
  Filter,
  Range,
  Target,
} = require('spleen');

const errors = require('./errors');
const Strategy = require('./strategy');


//
// ERROR MESSAGES
//


const msg = {
  argFilter: 'Argument "filter" must be an instance of spleen.Filter',
  argStrategy: 'Argument "strategy" must be an instance of Strategy',
  likeLiteral: 'Comparing literals to (n)like match expressions is unsupported',
  unknownOp: 'Unknown operator: ',
};


//
// CONSTANTS
//


/* eslint-disable no-useless-escape */
// ESLint's no-useless-escape rule is apparently broken
const invalidTarget = /["{}$;,()\[\]'*<>#$~@&%?:`\/\\]|-{2,}/;
/* eslint-enable no-useless-escape */

const defaultStrategy = new Strategy({});


//
// STATIC HELPER FUNCTIONS
//


function normalizeClause(clause) {
  if (clause.object instanceof Target) {
    const newClause = {
      subject: clause.object,
      operator: '',
      object: clause.subject,
    };

    switch (clause.operator.type) {
      case 'gt':
        newClause.operator = { type: 'lt' };
        break;

      case 'gte':
        newClause.operator = { type: 'lte' };
        break;

      case 'lt':
        newClause.operator = { type: 'gt' };
        break;

      case 'lte':
        newClause.operator = { type: 'gte' };
        break;

      default:
        newClause.operator = clause.operator;
        break;
    }

    return newClause;
  }

  return clause;
}


function scriptLiterals(clause) {
  switch (clause.operator.type) {
    case 'eq':
      return { $expr: { $eq: [clause.subject, clause.object] } };

    case 'neq':
      return { $expr: { $ne: [clause.subject, clause.object] } };

    case 'gt':
      return { $expr: { $gt: [clause.subject, clause.object] } };

    case 'gte':
      return { $expr: { $gte: [clause.subject, clause.object] } };

    case 'lt':
      return { $expr: { $lt: [clause.subject, clause.object] } };

    case 'lte':
      return { $expr: { $lte: [clause.subject, clause.object] } };

    case 'between':
      return {
        $expr: {
          $and: [
            { $gte: [clause.subject, clause.object.lower] },
            { $lte: [clause.subject, clause.object.upper] },
          ],
        },
      };

    case 'nbetween':
      return {
        $expr: {
          $or: [
            { $lt: [clause.subject, clause.object.lower] },
            { $gt: [clause.subject, clause.object.upper] },
          ],
        },
      };

    case 'in':
      return { $expr: { $in: [clause.subject, clause.object] } };

    case 'nin':
      return { $expr: { $not: { $in: [clause.subject, clause.object] } } };

    case 'like':
    case 'nlike':
      throw new errors.UnsupportedError(msg.likeLiteral);

    default:
      throw new errors.ConvertError(msg.unknownOp + clause.operator.type);
  }
}


function regex(clause) {
  return { $regex: clause.object.toRegex() };
}


function getAnd($and) {
  if ($and.length === 1) return $and[0];
  return { $and };
}


//
// BUILDER CLASS
//


class Builder {

  constructor(filter, strategy) {
    if (!(filter instanceof Filter)) throw new TypeError(msg.argFilter);
    if (!(strategy instanceof Strategy)) throw new TypeError(msg.argStrategy);

    this._filter = filter;
    this._strategy = strategy;
    this.fields = [];
    this.value = {};
  }


  _scriptTargets(clause) {
    const subject = this._target(clause.subject);
    const object = this._target(clause.object);
    const value = [`$${subject}`, `$${object}`];

    switch (clause.operator.type) {
      case 'eq':
        return { $expr: { $eq: value } };

      case 'neq':
        return { $expr: { $ne: value } };

      case 'gt':
        return { $expr: { $gt: value } };

      case 'gte':
        return { $expr: { $gte: value } };

      case 'lt':
        return { $expr: { $lt: value } };

      case 'lte':
        return { $expr: { $lte: value } };

      default:
        throw new errors.ConvertError();
    }
  }


  _target(target) {
    this._strategy.assertAllowed(target);

    let val = '';

    for (let i = 0; i < target.path.length; i++) {
      let segment = target.path[i];

      if (typeof segment !== 'string') {
        segment = segment.toString();
      }

      if (invalidTarget.test(segment)) {
        throw new errors.InvalidTargetError(target);
      }

      if (val.length > 0) val += '.';

      val += segment;
    }

    if (this.fields.indexOf(target.field) === -1) {
      this.fields.push(target.field);
    }

    return val;
  }


  _eq(clause) {
    return { [this._target(clause.subject)]: clause.object };
  }


  _neq(clause) {
    return {
      [this._target(clause.subject)]: { $ne: clause.object },
    };
  }


  _gt(clause) {
    return {
      [this._target(clause.subject)]: { $gt: clause.object },
    };
  }


  _gte(clause) {
    return {
      [this._target(clause.subject)]: { $gte: clause.object },
    };
  }


  _lt(clause) {
    return {
      [this._target(clause.subject)]: { $lt: clause.object },
    };
  }


  _lte(clause) {
    return {
      [this._target(clause.subject)]: { $lte: clause.object },
    };
  }


  _like(clause) {
    return {
      [this._target(clause.subject)]: regex(clause),
    };
  }


  _nlike(clause) {
    return {
      [this._target(clause.subject)]: { $not: regex(clause) },
    };
  }


  _between(clause) {
    const range = clause.object;
    const target = this._target(clause.subject);
    return {
      $and: [
        { [target]: { $gte: range.lower } },
        { [target]: { $lte: range.upper } },
      ],
    };
  }


  _nbetween(clause) {
    const range = clause.object;
    const target = this._target(clause.subject);
    return {
      $or: [
        { [target]: { $lt: range.lower } },
        { [target]: { $gt: range.upper } },
      ],
    };
  }


  _in(clause) {
    return {
      [this._target(clause.subject)]: { $in: clause.object },
    };
  }


  _nin(clause) {
    return {
      [this._target(clause.subject)]: { $nin: clause.object },
    };
  }


  _build(filter) {
    const $or = [];
    let $and = [];

    for (let i = 0; i < filter.statements.length; i++) {
      const statement = filter.statements[i];
      const sval = statement.value;

      if (statement.conjunctive === 'or') {
        $or.push(getAnd($and));
        $and = [];
      }

      if (sval instanceof Filter) {
        $and.push(this._build(sval));
        continue;
      }

      if (!(sval instanceof Clause)) throw new errors.ConvertError();

      const subIsTarget = sval.subject instanceof Target;
      const objIsTarget = sval.object instanceof Target;

      if (subIsTarget && objIsTarget) {
        $and.push(this._scriptTargets(sval));
        continue;
      }

      if (!subIsTarget && !objIsTarget) {
        $and.push(scriptLiterals(sval));
        continue;
      }

      const clause = normalizeClause(statement.value);

      switch (clause.operator.type) {
        case 'eq':
          $and.push(this._eq(clause));
          break;

        case 'neq':
          $and.push(this._neq(clause));
          break;

        case 'gt':
          $and.push(this._gt(clause));
          break;

        case 'gte':
          $and.push(this._gte(clause));
          break;

        case 'lt':
          $and.push(this._lt(clause));
          break;

        case 'lte':
          $and.push(this._lte(clause));
          break;

        case 'like':
          $and.push(this._like(clause));
          break;

        case 'nlike':
          $and.push(this._nlike(clause));
          break;

        case 'between':
          $and.push(this._between(clause));
          break;

        case 'nbetween':
          $and.push(this._nbetween(clause));
          break;

        case 'in':
          $and.push(this._in(clause));
          break;

        case 'nin':
          $and.push(this._nin(clause));
          break;

        default:
          throw new errors.ConvertError(msg.unknownOp + sval.operator.type);
      }
    }

    if ($or.length > 0) {
      $or.push(getAnd($and));
      return { $or };
    }

    return getAnd($and);
  }


  build() {
    this.value = this._build(this._filter);
  }


  validate() {
    this._strategy.assertMeetsRequired(this.fields);
  }

}


//
// CONVERT METHOD
//


module.exports = function convert(filter, strategy = defaultStrategy) {
  const builder = new Builder(filter, strategy);
  builder.build();
  builder.validate();

  return {
    fields: builder.fields,
    value: builder.value,
  };
};
