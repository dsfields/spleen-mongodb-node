'use strict';

const { assert } = require('chai');
const spleen = require('spleen');

const convert = require('../../lib/convert');
const errors = require('../../lib/errors');
const Strategy = require('../../lib/strategy');


describe('#convert', function() {
  it('throws if filter not instance of Filter', function() {
    assert.throws(() => {
      convert(42);
    }, TypeError);
  });

  it('throws if strategy not instance of Strategy', function() {
    assert.throws(() => {
      convert(spleen.parse('/foo eq 42').value, 42);
    }, TypeError);
  });

  it('returns object with value key', function() {
    const { value } = spleen.parse('/foo eq 42');
    const result = convert(value);
    assert.isObject(result.value);
  });

  it('returns object with fields key', function() {
    const { value } = spleen.parse('/foo eq 42');
    const result = convert(value);
    assert.isArray(result.fields);
  });

  it('returns object with no $and or $or if only single', function() {
    const { value } = spleen.parse('/foo eq 42');
    const result = convert(value);
    assert.notProperty(result.value, '$and');
    assert.notProperty(result.value, '$or');
  });

  it('returns object with $and when one and no or', function() {
    const { value } = spleen.parse('/foo eq 42 and /bar eq 24');
    const result = convert(value);
    assert.isArray(result.value.$and);
  });

  it('returns object with simple set for eq', function() {
    const { value } = spleen.parse('/foo eq 42');
    const result = convert(value);
    assert.deepEqual(result.value, { foo: 42 });
  });

  it('returns object with $ands with simple sets for eq', function() {
    const { value } = spleen.parse('/foo eq 42 and /bar eq 24');
    const result = convert(value);
    assert.isArray(result.value.$and);
    assert.deepEqual(result.value.$and[0], { foo: 42 });
    assert.deepEqual(result.value.$and[1], { bar: 24 });
  });

  it('returns object with $ors with simple sets for eq', function() {
    const { value } = spleen.parse('/foo eq "bar" or /baz eq "qux"');
    const result = convert(value);
    assert.isArray(result.value.$or);
    assert.deepEqual(result.value.$or[0], { foo: 'bar' });
    assert.deepEqual(result.value.$or[1], { baz: 'qux' });
  });

  it('returns object with key containing target', function() {
    const { value } = spleen.parse('/foo eq 42');
    const result = convert(value);
    assert.property(result.value, 'foo');
  });

  it('returns object with key containing n-part target for eq', function() {
    const { value } = spleen.parse('/foo/bar eq 42');
    const result = convert(value);
    assert.property(result.value, 'foo.bar');
  });

  it('returns object with key containing numeric field for eq', function() {
    const { value } = spleen.parse('/foo/bar/101/baz eq 42');
    const result = convert(value);
    assert.property(result.value, 'foo.bar.101.baz');
  });

  it('returns object with $expr $eq with two targets', function() {
    const { value } = spleen.parse('/foo/bar/101/baz eq /qux/quux');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isArray(result.value.$expr.$eq);
  });

  it('prefixes targets with $ when eq two targets', function() {
    const { value } = spleen.parse('/foo/bar/101/baz eq /qux/quux');
    const result = convert(value);
    assert.strictEqual(result.value.$expr.$eq[0], '$foo.bar.101.baz');
    assert.strictEqual(result.value.$expr.$eq[1], '$qux.quux');
  });

  it('returns object with #expr $eq for eq between literals', function() {
    const { value } = spleen.parse('42 eq 42');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isArray(result.value.$expr.$eq);
    assert.strictEqual(result.value.$expr.$eq[0], 42);
    assert.strictEqual(result.value.$expr.$eq[1], 42);
  });

  it('returns object with $ne for neq', function() {
    const { value } = spleen.parse('/foo neq 42');
    const result = convert(value);
    assert.deepEqual(result.value, { foo: { $ne: 42 } });
  });

  it('returns object with $ands with $ne for neq', function() {
    const { value } = spleen.parse('/foo neq 42 and /bar neq 24');
    const result = convert(value);
    assert.isArray(result.value.$and);
    assert.deepEqual(result.value.$and[0], { foo: { $ne: 42 } });
    assert.deepEqual(result.value.$and[1], { bar: { $ne: 24 } });
  });

  it('returns object with $ors with $ne for neq', function() {
    const { value } = spleen.parse('/foo neq "bar" or /baz neq "qux"');
    const result = convert(value);
    assert.isArray(result.value.$or);
    assert.deepEqual(result.value.$or[0], { foo: { $ne: 'bar' } });
    assert.deepEqual(result.value.$or[1], { baz: { $ne: 'qux' } });
  });

  it('returns object with key containing target', function() {
    const { value } = spleen.parse('/foo neq 42');
    const result = convert(value);
    assert.property(result.value, 'foo');
  });

  it('returns object with key containing n-part target for neq', function() {
    const { value } = spleen.parse('/foo/bar neq 42');
    const result = convert(value);
    assert.property(result.value, 'foo.bar');
  });

  it('returns object with key containing numeric field for neq', function() {
    const { value } = spleen.parse('/foo/bar/101/baz neq 42');
    const result = convert(value);
    assert.property(result.value, 'foo.bar.101.baz');
  });

  it('returns object with $expr $ne with two targets', function() {
    const { value } = spleen.parse('/foo/bar/101/baz neq /qux/quux');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isArray(result.value.$expr.$ne);
  });

  it('prefixes targets with $ when neq two targets', function() {
    const { value } = spleen.parse('/foo/bar/101/baz neq /qux/quux');
    const result = convert(value);
    assert.strictEqual(result.value.$expr.$ne[0], '$foo.bar.101.baz');
    assert.strictEqual(result.value.$expr.$ne[1], '$qux.quux');
  });

  it('returns object with #expr $ne for neq between literals', function() {
    const { value } = spleen.parse('42 neq 42');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isArray(result.value.$expr.$ne);
    assert.strictEqual(result.value.$expr.$ne[0], 42);
    assert.strictEqual(result.value.$expr.$ne[1], 42);
  });

  it('returns object with $gt for gt', function() {
    const { value } = spleen.parse('/foo gt 42');
    const result = convert(value);
    assert.deepEqual(result.value, { foo: { $gt: 42 } });
  });

  it('returns object with $ands with $gt for gt', function() {
    const { value } = spleen.parse('/foo gt 42 and /bar gt 24');
    const result = convert(value);
    assert.isArray(result.value.$and);
    assert.deepEqual(result.value.$and[0], { foo: { $gt: 42 } });
    assert.deepEqual(result.value.$and[1], { bar: { $gt: 24 } });
  });

  it('returns object with $ors with $gt for gt', function() {
    const { value } = spleen.parse('/foo gt "bar" or /baz gt "qux"');
    const result = convert(value);
    assert.isArray(result.value.$or);
    assert.deepEqual(result.value.$or[0], { foo: { $gt: 'bar' } });
    assert.deepEqual(result.value.$or[1], { baz: { $gt: 'qux' } });
  });

  it('returns object with key containing target for gt', function() {
    const { value } = spleen.parse('/foo gt 42');
    const result = convert(value);
    assert.property(result.value, 'foo');
  });

  it('returns object with key containing n-part target for gt', function() {
    const { value } = spleen.parse('/foo/bar gt 42');
    const result = convert(value);
    assert.property(result.value, 'foo.bar');
  });

  it('returns object with key containing numeric field for gt', function() {
    const { value } = spleen.parse('/foo/bar/101/baz gt 42');
    const result = convert(value);
    assert.property(result.value, 'foo.bar.101.baz');
  });

  it('returns object with $expr $gt with two targets', function() {
    const { value } = spleen.parse('/foo/bar/101/baz gt /qux/quux');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isArray(result.value.$expr.$gt);
  });

  it('prefixes targets with $ when gt two targets', function() {
    const { value } = spleen.parse('/foo/bar/101/baz gt /qux/quux');
    const result = convert(value);
    assert.strictEqual(result.value.$expr.$gt[0], '$foo.bar.101.baz');
    assert.strictEqual(result.value.$expr.$gt[1], '$qux.quux');
  });

  it('returns object with #expr $gt for gt between literals', function() {
    const { value } = spleen.parse('42 gt 42');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isArray(result.value.$expr.$gt);
    assert.strictEqual(result.value.$expr.$gt[0], 42);
    assert.strictEqual(result.value.$expr.$gt[1], 42);
  });

  it('returns object with $lt for gt if target object', function() {
    const { value } = spleen.parse('42 gt /foo');
    const result = convert(value);
    assert.deepEqual(result.value, { foo: { $lt: 42 } });
  });

  it('returns object with $gte for gte', function() {
    const { value } = spleen.parse('/foo gte 42');
    const result = convert(value);
    assert.deepEqual(result.value, { foo: { $gte: 42 } });
  });

  it('returns object with $ands with $gte for gte', function() {
    const { value } = spleen.parse('/foo gte 42 and /bar gte 24');
    const result = convert(value);
    assert.isArray(result.value.$and);
    assert.deepEqual(result.value.$and[0], { foo: { $gte: 42 } });
    assert.deepEqual(result.value.$and[1], { bar: { $gte: 24 } });
  });

  it('returns object with $ors with $gte for gte', function() {
    const { value } = spleen.parse('/foo gte "bar" or /baz gte "qux"');
    const result = convert(value);
    assert.isArray(result.value.$or);
    assert.deepEqual(result.value.$or[0], { foo: { $gte: 'bar' } });
    assert.deepEqual(result.value.$or[1], { baz: { $gte: 'qux' } });
  });

  it('returns object with key containing target for gte', function() {
    const { value } = spleen.parse('/foo gte 42');
    const result = convert(value);
    assert.property(result.value, 'foo');
  });

  it('returns object with key containing n-part target for gte', function() {
    const { value } = spleen.parse('/foo/bar gte 42');
    const result = convert(value);
    assert.property(result.value, 'foo.bar');
  });

  it('returns object with key containing numeric field for gte', function() {
    const { value } = spleen.parse('/foo/bar/101/baz gte 42');
    const result = convert(value);
    assert.property(result.value, 'foo.bar.101.baz');
  });

  it('returns object with $expr $gte with two targets', function() {
    const { value } = spleen.parse('/foo/bar/101/baz gte /qux/quux');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isArray(result.value.$expr.$gte);
  });

  it('prefixes targets with $ when gte two targets', function() {
    const { value } = spleen.parse('/foo/bar/101/baz gte /qux/quux');
    const result = convert(value);
    assert.strictEqual(result.value.$expr.$gte[0], '$foo.bar.101.baz');
    assert.strictEqual(result.value.$expr.$gte[1], '$qux.quux');
  });

  it('returns object with #expr $gte for gte between literals', function() {
    const { value } = spleen.parse('42 gte 42');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isArray(result.value.$expr.$gte);
    assert.strictEqual(result.value.$expr.$gte[0], 42);
    assert.strictEqual(result.value.$expr.$gte[1], 42);
  });

  it('returns object with $lte for gte if target object', function() {
    const { value } = spleen.parse('42 gte /foo');
    const result = convert(value);
    assert.deepEqual(result.value, { foo: { $lte: 42 } });
  });

  it('returns object with $lt for lt', function() {
    const { value } = spleen.parse('/foo lt 42');
    const result = convert(value);
    assert.deepEqual(result.value, { foo: { $lt: 42 } });
  });

  it('returns object with $ands with $lt for lt', function() {
    const { value } = spleen.parse('/foo lt 42 and /bar lt 24');
    const result = convert(value);
    assert.isArray(result.value.$and);
    assert.deepEqual(result.value.$and[0], { foo: { $lt: 42 } });
    assert.deepEqual(result.value.$and[1], { bar: { $lt: 24 } });
  });

  it('returns object with $ors with $lt for lt', function() {
    const { value } = spleen.parse('/foo lt "bar" or /baz lt "qux"');
    const result = convert(value);
    assert.isArray(result.value.$or);
    assert.deepEqual(result.value.$or[0], { foo: { $lt: 'bar' } });
    assert.deepEqual(result.value.$or[1], { baz: { $lt: 'qux' } });
  });

  it('returns object with key containing target for lt', function() {
    const { value } = spleen.parse('/foo lt 42');
    const result = convert(value);
    assert.property(result.value, 'foo');
  });

  it('returns object with key containing n-part target for lt', function() {
    const { value } = spleen.parse('/foo/bar lt 42');
    const result = convert(value);
    assert.property(result.value, 'foo.bar');
  });

  it('returns object with key containing numeric field for lt', function() {
    const { value } = spleen.parse('/foo/bar/101/baz lt 42');
    const result = convert(value);
    assert.property(result.value, 'foo.bar.101.baz');
  });

  it('returns object with $expr $lt with two targets', function() {
    const { value } = spleen.parse('/foo/bar/101/baz lt /qux/quux');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isArray(result.value.$expr.$lt);
  });

  it('prefixes targets with $ when lt two targets', function() {
    const { value } = spleen.parse('/foo/bar/101/baz lt /qux/quux');
    const result = convert(value);
    assert.strictEqual(result.value.$expr.$lt[0], '$foo.bar.101.baz');
    assert.strictEqual(result.value.$expr.$lt[1], '$qux.quux');
  });

  it('returns object with #expr $lt for lt between literals', function() {
    const { value } = spleen.parse('42 lt 42');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isArray(result.value.$expr.$lt);
    assert.strictEqual(result.value.$expr.$lt[0], 42);
    assert.strictEqual(result.value.$expr.$lt[1], 42);
  });

  it('returns object with $gt for lt if target object', function() {
    const { value } = spleen.parse('42 lt /foo');
    const result = convert(value);
    assert.deepEqual(result.value, { foo: { $gt: 42 } });
  });

  it('returns object with $lte for lte', function() {
    const { value } = spleen.parse('/foo lte 42');
    const result = convert(value);
    assert.deepEqual(result.value, { foo: { $lte: 42 } });
  });

  it('returns object with $ands with $lte for lte', function() {
    const { value } = spleen.parse('/foo lte 42 and /bar lte 24');
    const result = convert(value);
    assert.isArray(result.value.$and);
    assert.deepEqual(result.value.$and[0], { foo: { $lte: 42 } });
    assert.deepEqual(result.value.$and[1], { bar: { $lte: 24 } });
  });

  it('returns object with $ors with $lte for lte', function() {
    const { value } = spleen.parse('/foo lte "bar" or /baz lte "qux"');
    const result = convert(value);
    assert.isArray(result.value.$or);
    assert.deepEqual(result.value.$or[0], { foo: { $lte: 'bar' } });
    assert.deepEqual(result.value.$or[1], { baz: { $lte: 'qux' } });
  });

  it('returns object with key containing target for lte', function() {
    const { value } = spleen.parse('/foo lte 42');
    const result = convert(value);
    assert.property(result.value, 'foo');
  });

  it('returns object with key containing n-part target for lte', function() {
    const { value } = spleen.parse('/foo/bar lte 42');
    const result = convert(value);
    assert.property(result.value, 'foo.bar');
  });

  it('returns object with key containing numeric field for lte', function() {
    const { value } = spleen.parse('/foo/bar/101/baz lte 42');
    const result = convert(value);
    assert.property(result.value, 'foo.bar.101.baz');
  });

  it('returns object with $expr $lte with two targets', function() {
    const { value } = spleen.parse('/foo/bar/101/baz lte /qux/quux');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isArray(result.value.$expr.$lte);
  });

  it('prefixes targets with $ when lte two targets', function() {
    const { value } = spleen.parse('/foo/bar/101/baz lte /qux/quux');
    const result = convert(value);
    assert.strictEqual(result.value.$expr.$lte[0], '$foo.bar.101.baz');
    assert.strictEqual(result.value.$expr.$lte[1], '$qux.quux');
  });

  it('returns object with #expr $lte for lte between literals', function() {
    const { value } = spleen.parse('42 lte 42');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isArray(result.value.$expr.$lte);
    assert.strictEqual(result.value.$expr.$lte[0], 42);
    assert.strictEqual(result.value.$expr.$lte[1], 42);
  });

  it('returns object with $gte for lte if target object', function() {
    const { value } = spleen.parse('42 lte /foo');
    const result = convert(value);
    assert.deepEqual(result.value, { foo: { $gte: 42 } });
  });

  it('returns object with $regex for like', function() {
    const { value } = spleen.parse('/foo like "*Bar_"');
    const result = convert(value);
    assert.deepEqual(result.value, { foo: { $regex: /^.*Bar.{1}$/i } });
  });

  it('returns object with $ands with $regex for like', function() {
    const { value } = spleen.parse('/foo like "*Bar_" and /baz like "_Qux*"');
    const result = convert(value);
    assert.isArray(result.value.$and);
    assert.deepEqual(result.value.$and[0], { foo: { $regex: /^.*Bar.{1}$/i } });
    assert.deepEqual(result.value.$and[1], { baz: { $regex: /^.{1}Qux.*$/i } });
  });

  it('returns object with $ors with $regex for like', function() {
    const { value } = spleen.parse('/foo like "*Bar_" or /baz like "_Qux*"');
    const result = convert(value);
    assert.isArray(result.value.$or);
    assert.deepEqual(result.value.$or[0], { foo: { $regex: /^.*Bar.{1}$/i } });
    assert.deepEqual(result.value.$or[1], { baz: { $regex: /^.{1}Qux.*$/i } });
  });

  it('returns object with key containing target for like', function() {
    const { value } = spleen.parse('/foo like "*Bar_"');
    const result = convert(value);
    assert.property(result.value, 'foo');
  });

  it('returns object with key containing n-part target for like', function() {
    const { value } = spleen.parse('/foo/bar like "*Bar_"');
    const result = convert(value);
    assert.property(result.value, 'foo.bar');
  });

  it('returns object with key containing numeric field for like', function() {
    const { value } = spleen.parse('/foo/bar/101/baz like "*Bar_"');
    const result = convert(value);
    assert.property(result.value, 'foo.bar.101.baz');
  });

  it('throws if like with literal subject', function() {
    const { value } = spleen.parse('"foo" like "*Bar_"');

    assert.throws(() => {
      convert(value);
    }, errors.UnsupportedError);
  });

  it('returns object with $not $regex for nlike', function() {
    const { value } = spleen.parse('/foo nlike "*Bar_"');
    const result = convert(value);
    assert.deepEqual(
      result.value,
      { foo: { $not: { $regex: /^.*Bar.{1}$/i } } }
    );
  });

  it('returns object with $ands with $not $regex for nlike', function() {
    const { value } = spleen.parse('/foo nlike "*Bar_" and /baz nlike "_Qux*"');
    const result = convert(value);
    assert.isArray(result.value.$and);
    assert.deepEqual(
      result.value.$and[0],
      { foo: { $not: { $regex: /^.*Bar.{1}$/i } } }
    );
    assert.deepEqual(
      result.value.$and[1],
      { baz: { $not: { $regex: /^.{1}Qux.*$/i } } }
    );
  });

  it('returns object with $ors with $not $regex for nlike', function() {
    const { value } = spleen.parse('/foo nlike "*Bar_" or /baz nlike "_Qux*"');
    const result = convert(value);
    assert.isArray(result.value.$or);
    assert.deepEqual(
      result.value.$or[0],
      { foo: { $not: { $regex: /^.*Bar.{1}$/i } } }
    );
    assert.deepEqual(
      result.value.$or[1],
      { baz: { $not: { $regex: /^.{1}Qux.*$/i } } }
    );
  });

  it('returns object with key containing target for nlike', function() {
    const { value } = spleen.parse('/foo nlike "*Bar_"');
    const result = convert(value);
    assert.property(result.value, 'foo');
  });

  it('returns object with key containing n-part target for nlike', function() {
    const { value } = spleen.parse('/foo/bar nlike "*Bar_"');
    const result = convert(value);
    assert.property(result.value, 'foo.bar');
  });

  it('returns object with key containing numeric field for nlike', function() {
    const { value } = spleen.parse('/foo/bar/101/baz nlike "*Bar_"');
    const result = convert(value);
    assert.property(result.value, 'foo.bar.101.baz');
  });

  it('throws if nlike with literal subject', function() {
    const { value } = spleen.parse('"foo" nlike "*Bar_"');

    assert.throws(() => {
      convert(value);
    }, errors.UnsupportedError);
  });

  it('returns object with $gte and $tle for between', function() {
    const { value } = spleen.parse('/foo between 0,42');
    const result = convert(value);
    assert.deepEqual(
      result.value,
      {
        $and: [
          { foo: { $gte: 0 } },
          { foo: { $lte: 42 } },
        ],
      }
    );
  });

  it('returns object with $ands with $gte and $tle for between', function() {
    const { value } = spleen.parse('/foo between 0,42 and /bar between 0,24');
    const result = convert(value);
    assert.isArray(result.value.$and);
    assert.deepEqual(
      result.value.$and[0],
      {
        $and: [
          { foo: { $gte: 0 } },
          { foo: { $lte: 42 } },
        ],
      }
    );
    assert.deepEqual(
      result.value.$and[1],
      {
        $and: [
          { bar: { $gte: 0 } },
          { bar: { $lte: 24 } },
        ],
      }
    );
  });

  it('returns object with $ors with $gte and $lte for between', function() {
    const { value } = spleen.parse('/foo between 0,42 or /bar between 0,24');
    const result = convert(value);
    assert.isArray(result.value.$or);
    assert.deepEqual(
      result.value.$or[0],
      {
        $and: [
          { foo: { $gte: 0 } },
          { foo: { $lte: 42 } },
        ],
      }
    );
    assert.deepEqual(
      result.value.$or[1],
      {
        $and: [
          { bar: { $gte: 0 } },
          { bar: { $lte: 24 } },
        ],
      }
    );
  });

  it('returns object with key containing target for between', function() {
    const { value } = spleen.parse('/foo between 0,42');
    const result = convert(value);
    assert.property(result.value.$and[0], 'foo');
    assert.property(result.value.$and[1], 'foo');
  });

  it('returns object with key containing n-part target for between', function() {
    const { value } = spleen.parse('/foo/bar between 0,42');
    const result = convert(value);
    assert.property(result.value.$and[0], 'foo.bar');
    assert.property(result.value.$and[1], 'foo.bar');
  });

  it('returns object with key containing numeric field for between', function() {
    const { value } = spleen.parse('/foo/bar/101/baz between 35,42');
    const result = convert(value);
    assert.property(result.value.$and[0], 'foo.bar.101.baz');
    assert.property(result.value.$and[1], 'foo.bar.101.baz');
  });

  it('returns object with #expr $gte/$lte for between of literals', function() {
    const { value } = spleen.parse('42 between 0,42');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isArray(result.value.$expr.$and);
    assert.isArray(result.value.$expr.$and[0].$gte);
    assert.isArray(result.value.$expr.$and[1].$lte);
    assert.strictEqual(result.value.$expr.$and[0].$gte[0], 42);
    assert.strictEqual(result.value.$expr.$and[0].$gte[1], 0);
    assert.strictEqual(result.value.$expr.$and[1].$lte[0], 42);
    assert.strictEqual(result.value.$expr.$and[1].$lte[1], 42);
  });

  it('returns object with $lt and $gt for nbetween', function() {
    const { value } = spleen.parse('/foo nbetween 0,42');
    const result = convert(value);
    assert.deepEqual(
      result.value,
      {
        $or: [
          { foo: { $lt: 0 } },
          { foo: { $gt: 42 } },
        ],
      }
    );
  });

  it('returns object with $ands with $lt and $gt for nbetween', function() {
    const { value } = spleen.parse('/foo nbetween 0,42 and /bar nbetween 0,24');
    const result = convert(value);
    assert.isArray(result.value.$and);
    assert.deepEqual(
      result.value.$and[0],
      {
        $or: [
          { foo: { $lt: 0 } },
          { foo: { $gt: 42 } },
        ],
      }
    );
    assert.deepEqual(
      result.value.$and[1],
      {
        $or: [
          { bar: { $lt: 0 } },
          { bar: { $gt: 24 } },
        ],
      }
    );
  });

  it('returns object with $ors with $lt and $gt for nbetween', function() {
    const { value } = spleen.parse('/foo nbetween 0,42 or /bar nbetween 0,24');
    const result = convert(value);
    assert.isArray(result.value.$or);
    assert.deepEqual(
      result.value.$or[0],
      {
        $or: [
          { foo: { $lt: 0 } },
          { foo: { $gt: 42 } },
        ],
      }
    );
    assert.deepEqual(
      result.value.$or[1],
      {
        $or: [
          { bar: { $lt: 0 } },
          { bar: { $gt: 24 } },
        ],
      }
    );
  });

  it('returns object with key containing target for nbetween', function() {
    const { value } = spleen.parse('/foo nbetween 0,42');
    const result = convert(value);
    assert.property(result.value.$or[0], 'foo');
    assert.property(result.value.$or[1], 'foo');
  });

  it('returns object with key containing n-part target for nbetween', function() {
    const { value } = spleen.parse('/foo/bar nbetween 0,42');
    const result = convert(value);
    assert.property(result.value.$or[0], 'foo.bar');
    assert.property(result.value.$or[1], 'foo.bar');
  });

  it('returns object with key containing numeric field for nbetween', function() {
    const { value } = spleen.parse('/foo/bar/101/baz nbetween 35,42');
    const result = convert(value);
    assert.property(result.value.$or[0], 'foo.bar.101.baz');
    assert.property(result.value.$or[1], 'foo.bar.101.baz');
  });

  it('returns object with #expr $lt/$gt for nbetween of literals', function() {
    const { value } = spleen.parse('42 nbetween 0,42');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isArray(result.value.$expr.$or);
    assert.isArray(result.value.$expr.$or[0].$lt);
    assert.isArray(result.value.$expr.$or[1].$gt);
    assert.strictEqual(result.value.$expr.$or[0].$lt[0], 42);
    assert.strictEqual(result.value.$expr.$or[0].$lt[1], 0);
    assert.strictEqual(result.value.$expr.$or[1].$gt[0], 42);
    assert.strictEqual(result.value.$expr.$or[1].$gt[1], 42);
  });

  it('returns object with $in for in', function() {
    const { value } = spleen.parse('/foo in ["b","a","r"]');
    const result = convert(value);
    assert.deepEqual(result.value, { foo: { $in: ['b', 'a', 'r'] } });
  });

  it('returns object with $ands with $in for in', function() {
    const { value } = spleen.parse('/foo in ["b","a","r"] and /baz in ["q","u","x"]');
    const result = convert(value);
    assert.isArray(result.value.$and);
    assert.deepEqual(result.value.$and[0], { foo: { $in: ['b', 'a', 'r'] } });
    assert.deepEqual(result.value.$and[1], { baz: { $in: ['q', 'u', 'x'] } });
  });

  it('returns object with $ors with $in for in', function() {
    const { value } = spleen.parse('/foo in ["b","a","r"] or /baz in ["q","u","x"]');
    const result = convert(value);
    assert.isArray(result.value.$or);
    assert.deepEqual(result.value.$or[0], { foo: { $in: ['b', 'a', 'r'] } });
    assert.deepEqual(result.value.$or[1], { baz: { $in: ['q', 'u', 'x'] } });
  });

  it('returns object with key containing target for in', function() {
    const { value } = spleen.parse('/foo in ["b","a","r"]');
    const result = convert(value);
    assert.property(result.value, 'foo');
  });

  it('returns object with key containing n-part target for in', function() {
    const { value } = spleen.parse('/foo/bar in [1,2,3]');
    const result = convert(value);
    assert.property(result.value, 'foo.bar');
  });

  it('returns object with key containing numeric field for in', function() {
    const { value } = spleen.parse('/foo/bar/101/baz in [1,2,3]');
    const result = convert(value);
    assert.property(result.value, 'foo.bar.101.baz');
  });

  it('returns object with #expr $in for in with literals', function() {
    const { value } = spleen.parse('42 in [1,2,3,5,8]');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isArray(result.value.$expr.$in);
    assert.strictEqual(result.value.$expr.$in[0], 42);
    assert.deepEqual(result.value.$expr.$in[1], [1, 2, 3, 5, 8]);
  });

  it('returns object with $nin for nin', function() {
    const { value } = spleen.parse('/foo nin ["b","a","r"]');
    const result = convert(value);
    assert.deepEqual(result.value, { foo: { $nin: ['b', 'a', 'r'] } });
  });

  it('returns object with $ands with $nin for nin', function() {
    const { value } = spleen.parse('/foo nin ["b","a","r"] and /baz nin ["q","u","x"]');
    const result = convert(value);
    assert.isArray(result.value.$and);
    assert.deepEqual(result.value.$and[0], { foo: { $nin: ['b', 'a', 'r'] } });
    assert.deepEqual(result.value.$and[1], { baz: { $nin: ['q', 'u', 'x'] } });
  });

  it('returns object with $ors with $nin for nin', function() {
    const { value } = spleen.parse('/foo nin ["b","a","r"] or /baz nin ["q","u","x"]');
    const result = convert(value);
    assert.isArray(result.value.$or);
    assert.deepEqual(result.value.$or[0], { foo: { $nin: ['b', 'a', 'r'] } });
    assert.deepEqual(result.value.$or[1], { baz: { $nin: ['q', 'u', 'x'] } });
  });

  it('returns object with key containing target for nin', function() {
    const { value } = spleen.parse('/foo nin ["b","a","r"]');
    const result = convert(value);
    assert.property(result.value, 'foo');
  });

  it('returns object with key containing n-part target for nin', function() {
    const { value } = spleen.parse('/foo/bar nin [1,2,3]');
    const result = convert(value);
    assert.property(result.value, 'foo.bar');
  });

  it('returns object with key containing numeric field for nin', function() {
    const { value } = spleen.parse('/foo/bar/101/baz nin [1,2,3]');
    const result = convert(value);
    assert.property(result.value, 'foo.bar.101.baz');
  });

  it('returns object with #expr $not $in for nin with literals', function() {
    const { value } = spleen.parse('42 nin [1,2,3,5,8]');
    const result = convert(value);
    assert.isObject(result.value.$expr);
    assert.isObject(result.value.$expr.$not);
    assert.isArray(result.value.$expr.$not.$in);
    assert.strictEqual(result.value.$expr.$not.$in[0], 42);
    assert.deepEqual(result.value.$expr.$not.$in[1], [1, 2, 3, 5, 8]);
  });

  it('throws if unknown operator', function() {
    const { value } = spleen.parse('/foo eq 42');
    value.statements[0].value.operator = { type: 'bar' };

    assert.throws(() => {
      convert(value);
    }, errors.ConvertError);
  });

  it('throws if unknown operator between two targets', function() {
    const { value } = spleen.parse('/foo eq /bar');
    value.statements[0].value.operator = { type: 'baz' };

    assert.throws(() => {
      convert(value);
    }, errors.ConvertError);
  });

  it('throws if unknown operator between two literals', function() {
    const { value } = spleen.parse('42 eq 42');
    value.statements[0].value.operator = { type: 'foo' };

    assert.throws(() => {
      convert(value);
    }, errors.ConvertError);
  });

  it('throws if unknown operator between two literal and target', function() {
    const { value } = spleen.parse('42 eq /bar');
    value.statements[0].value.operator = { type: 'foo' };

    assert.throws(() => {
      convert(value);
    }, errors.ConvertError);
  });

  it('throws if clause corrupted', function() {
    const { value } = spleen.parse('42 eq /bar');
    value.statements[0].value = 'Nope';

    assert.throws(() => {
      convert(value);
    }, errors.ConvertError);
  });

  it('throws if target contains "', function() {
    const { value } = spleen.parse('/f\\"oo eq 42');

    assert.throws(() => {
      convert(value);
    }, errors.InvalidTargetError);
  });

  it('throws if target contains {', function() {
    const { value } = spleen.parse('/f\\{oo eq 42');

    assert.throws(() => {
      convert(value);
    }, errors.InvalidTargetError);
  });

  it('throws if target contains }', function() {
    const { value } = spleen.parse('/f\\}oo eq 42');

    assert.throws(() => {
      convert(value);
    }, errors.InvalidTargetError);
  });

  it('throws if target contains $', function() {
    const { value } = spleen.parse('/$foo eq 42');

    assert.throws(() => {
      convert(value);
    }, errors.InvalidTargetError);
  });

  it('throws if target contains \'', function() {
    const { value } = spleen.parse('/f\'oo eq 42');

    assert.throws(() => {
      convert(value);
    }, errors.InvalidTargetError);
  });

  it('throws if using black-listed field', function() {
    const { value } = spleen.parse('/foo eq 42 and /bar/0 lt 22');
    const strategy = new Strategy({
      deny: ['/bar'],
    });

    assert.throws(() => {
      convert(value, strategy);
    }, errors.DeniedFieldError);
  });

  it('does not throw if not using black-listed field', function() {
    const { value } = spleen.parse('/foo eq 42 and /bar/0 lt 22');
    const strategy = new Strategy({
      deny: ['/baz'],
    });

    assert.doesNotThrow(() => {
      convert(value, strategy);
    }, errors.DeniedFieldError);
  });

  it('throws if using non-white-listed field', function() {
    const { value } = spleen.parse('/foo eq 42 and /bar/0 lt 22');
    const strategy = new Strategy({
      allow: ['/foo'],
    });

    assert.throws(() => {
      convert(value, strategy);
    }, errors.UnallowedFieldError);
  });

  it('does not throw if using all white-listed field', function() {
    const { value } = spleen.parse('/foo eq 42 and /bar/0 lt 22');
    const strategy = new Strategy({
      allow: ['/foo', '/bar'],
    });

    assert.doesNotThrow(() => {
      convert(value, strategy);
    }, errors.UnallowedFieldError);
  });

  it('throws if missing all required fields', function() {
    const { value } = spleen.parse('/foo eq 42 and /bar/0 lt 22');
    const strategy = new Strategy({
      require: {
        fields: ['/bar', '/baz'],
        which: 'all',
      },
    });

    assert.throws(() => {
      convert(value, strategy);
    }, errors.RequiredFieldError);
  });

  it('does not throw if contains all required fields', function() {
    const { value } = spleen.parse('/foo eq 42 and /bar/0 lt 22');
    const strategy = new Strategy({
      require: {
        fields: ['/foo', '/bar'],
        which: 'all',
      },
    });

    assert.doesNotThrow(() => {
      convert(value, strategy);
    }, errors.RequiredFieldError);
  });

  it('throws if missing any required field', function() {
    const { value } = spleen.parse('/foo eq 42 and /bar/0 lt 22');
    const strategy = new Strategy({
      require: {
        fields: ['/baz', '/qux'],
        which: 'any',
      },
    });

    assert.throws(() => {
      convert(value, strategy);
    }, errors.RequiredFieldError);
  });

  it('does not throw if contains any required field', function() {
    const { value } = spleen.parse('/foo eq 42 and /bar/0 lt 22');
    const strategy = new Strategy({
      require: {
        fields: ['/bar', '/qux'],
        which: 'any',
      },
    });

    assert.doesNotThrow(() => {
      convert(value, strategy);
    }, errors.RequiredFieldError);
  });

  it('returns all used fields', function() {
    const { value } = spleen.parse('/foo eq 42 and /bar/0 lt 22 or /baz gt 2');
    const { fields } = convert(value);
    assert.deepEqual(fields, ['/foo', '/bar', '/baz']);
  });

  it('does not duplicate fields used more than once', function() {
    const { value } = spleen.parse('/foo eq 42 and /bar/0 lt 22 or /bar/1 gt 2');
    const { fields } = convert(value);
    assert.lengthOf(fields, 2);
    assert.deepEqual(fields, ['/foo', '/bar']);
  });

  it('returns $ors of $ands', function() {
    const { value } = spleen.parse('/foo eq 42 and /bar/0 lt 22 or /baz gt 2 and /qux lte 100');
    const result = convert(value);
    assert.isArray(result.value.$or);
    assert.isArray(result.value.$or[0].$and);
    assert.isArray(result.value.$or[1].$and);
  });

  it('nests anded subfilter', function() {
    const { value } = spleen.parse('/foo eq 42 and (/bar neq 24 or /baz gt 2)');
    const result = convert(value);
    assert.isArray(result.value.$and);
    assert.deepEqual(result.value.$and[0], { foo: 42 });
    assert.isArray(result.value.$and[1].$or);
    assert.deepEqual(result.value.$and[1].$or[0], { bar: { $ne: 24 } });
    assert.deepEqual(result.value.$and[1].$or[1], { baz: { $gt: 2 } });
  });
});
