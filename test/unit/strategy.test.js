'use strict';

const { assert } = require('chai');
const { Target } = require('spleen');

const errors = require('../../lib/errors');
const Strategy = require('../../lib/strategy');


describe('Strategy', function () {
  describe('#constructor', function () {
    it('throws if options not object', function () {
      assert.throws(() => {
        const result = new Strategy(42);
        assert.isNotOk(result);
      }, TypeError);
    });

    it('throws if allow not array', function () {
      assert.throws(() => {
        const result = new Strategy({ allow: 42 });
        assert.isNotOk(result);
      }, TypeError);
    });

    it('does not throw if allow array', function () {
      assert.doesNotThrow(() => {
        const result = new Strategy({ allow: [] });
        assert.isOk(result);
      }, TypeError);
    });

    it('throws if deny not array', function () {
      assert.throws(() => {
        const result = new Strategy({ deny: 42 });
        assert.isNotOk(result);
      }, TypeError);
    });

    it('does not throw if deny array', function () {
      assert.doesNotThrow(() => {
        const result = new Strategy({ deny: [] });
        assert.isOk(result);
      }, TypeError);
    });

    it('throws if allow and deny both provided', function () {
      assert.throws(() => {
        const result = new Strategy({
          allow: ['/foo'],
          deny: ['/foo'],
        });
        assert.isNotOk(result);
      }, TypeError);
    });

    it('does not throw if allow provided', function () {
      assert.doesNotThrow(() => {
        const result = new Strategy({ allow: ['/foo'] });
        assert.isOk(result);
      }, TypeError);
    });

    it('does not throw if deny provided', function () {
      assert.doesNotThrow(() => {
        const result = new Strategy({ deny: ['/foo'] });
        assert.isOk(result);
      }, TypeError);
    });

    it('throws if require not object', function () {
      assert.throws(() => {
        const result = new Strategy({ require: 42 });
        assert.isNotOk(result);
      }, TypeError);
    });

    it('throws if require.fields not array', function () {
      assert.throws(() => {
        const result = new Strategy({
          require: { fields: 42 },
        });
        assert.isNotOk(result);
      }, TypeError);
    });

    it('does not throw if require.fields array', function () {
      assert.doesNotThrow(() => {
        const result = new Strategy({
          require: { fields: [] },
        });
        assert.isOk(result);
      }, TypeError);
    });

    it('throws if require.which not any or all', function () {
      assert.throws(() => {
        const result = new Strategy({
          require: { which: 42 },
        });
        assert.isNotOk(result);
      }, TypeError);
    });

    it('does not throw if require.which any', function () {
      assert.doesNotThrow(() => {
        const result = new Strategy({
          require: { which: 'any' },
        });
        assert.isOk(result);
      }, TypeError);
    });

    it('does not throw if require.which all', function () {
      assert.doesNotThrow(() => {
        const result = new Strategy({
          require: { which: 'all' },
        });
        assert.isOk(result);
      }, TypeError);
    });
  });


  describe('#assertAllowed', function () {
    it('does not throw DeniedFieldError if no deny or allow', function () {
      const strategy = new Strategy({});
      const target = Target.jsonPointer('/foo/bar');

      assert.doesNotThrow(() => {
        strategy.assertAllowed(target);
      }, errors.DeniedFieldError);
    });

    it('does not throw UnallowedFieldError if no deny or allow', function () {
      const strategy = new Strategy({});
      const target = Target.jsonPointer('/foo/bar');

      assert.doesNotThrow(() => {
        strategy.assertAllowed(target);
      }, errors.UnallowedFieldError);
    });

    it('throws if target black-listed', function () {
      const denied = '/foo/bar';
      const strategy = new Strategy({ deny: [denied] });
      const target = Target.jsonPointer(denied);

      assert.throws(() => {
        strategy.assertAllowed(target);
      }, errors.DeniedFieldError);
    });

    it('does not throw if target not black-listed', function () {
      const denied = '/foo/bar';
      const allowed = '/qux';
      const strategy = new Strategy({ deny: [denied] });
      const target = Target.jsonPointer(allowed);

      assert.doesNotThrow(() => {
        strategy.assertAllowed(target);
      }, errors.DeniedFieldError);
    });

    it('throws if target not white-listed', function () {
      const denied = '/foo/bar';
      const allowed = '/qux';
      const strategy = new Strategy({ allow: [allowed] });
      const target = Target.jsonPointer(denied);

      assert.throws(() => {
        strategy.assertAllowed(target);
      }, errors.UnallowedFieldError);
    });

    it('does not throw if target white-listed', function () {
      const allowed = '/qux';
      const strategy = new Strategy({ allow: [allowed] });
      const target = Target.jsonPointer(allowed);

      assert.doesNotThrow(() => {
        strategy.assertAllowed(target);
      }, errors.UnallowedFieldError);
    });
  });


  describe('#assertMeetsRequired', function () {
    it('does not throw if nothing required', function () {
      const strategy = new Strategy();

      assert.doesNotThrow(() => {
        strategy.assertMeetsRequired(['/foo', '/bar']);
      }, errors.RequiredFieldError);
    });

    it('throws if any required, and all missing', function () {
      const strategy = new Strategy({
        require: {
          fields: ['/qux', '/quux'],
          which: 'any',
        },
      });

      assert.throws(() => {
        strategy.assertMeetsRequired(['/foo', '/bar']);
      }, errors.RequiredFieldError);
    });

    it('does not throw if any required, at least one present', function () {
      const strategy = new Strategy({
        require: {
          fields: ['/qux', '/quux'],
          which: 'any',
        },
      });

      assert.doesNotThrow(() => {
        strategy.assertMeetsRequired(['/foo', '/bar', '/qux']);
      }, errors.RequiredFieldError);
    });

    it('does not throw if any required, all present', function () {
      const strategy = new Strategy({
        require: {
          fields: ['/qux', '/quux'],
          which: 'any',
        },
      });

      assert.doesNotThrow(() => {
        strategy.assertMeetsRequired(['/qux', '/quux']);
      }, errors.RequiredFieldError);
    });

    it('does not throw if any required, all+ present', function () {
      const strategy = new Strategy({
        require: {
          fields: ['/qux', '/quux'],
          which: 'any',
        },
      });

      assert.doesNotThrow(() => {
        strategy.assertMeetsRequired(['/foo', '/bar', '/qux', '/quux']);
      }, errors.RequiredFieldError);
    });

    it('throws if all required, and some missing', function () {
      const strategy = new Strategy({
        require: {
          fields: ['/qux', '/quux'],
          which: 'all',
        },
      });

      assert.throws(() => {
        strategy.assertMeetsRequired(['/foo', '/bar', '/qux']);
      }, errors.RequiredFieldError);
    });

    it('throws if all required, and all missing', function () {
      const strategy = new Strategy({
        require: {
          fields: ['/qux', '/quux'],
          which: 'all',
        },
      });

      assert.throws(() => {
        strategy.assertMeetsRequired(['/foo', '/bar']);
      }, errors.RequiredFieldError);
    });

    it('does not throw if all required, all present', function () {
      const strategy = new Strategy({
        require: {
          fields: ['/qux', '/quux'],
          which: 'all',
        },
      });

      assert.doesNotThrow(() => {
        strategy.assertMeetsRequired(['/qux', '/quux']);
      }, errors.RequiredFieldError);
    });

    it('does not throw if all required, and all+ present', function () {
      const strategy = new Strategy({
        require: {
          fields: ['/qux', '/quux'],
          which: 'all',
        },
      });

      assert.doesNotThrow(() => {
        strategy.assertMeetsRequired(['/foo', '/bar', '/qux', '/quux']);
      }, errors.RequiredFieldError);
    });
  });
});
