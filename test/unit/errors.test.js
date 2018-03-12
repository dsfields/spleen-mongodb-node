'use strict';

const { assert } = require('chai');
const { Target } = require('spleen');

const errors = require('../../lib/errors');


describe('errors', function() {

  describe('ConvertError', function() {
    it('sets message to default if none provided', function() {
      const result = new errors.ConvertError();
      assert.strictEqual(result.message, errors.ConvertError.defaultMessage);
    });

    it('sets message to provided', function() {
      const result = new errors.ConvertError('test');
      assert.strictEqual(result.message, 'test');
    });
  });


  describe('DeniedFieldError', function() {
    it('sets message to default suffixed with field', function() {
      const field = '/foo/bar';
      const result = new errors.DeniedFieldError(field);
      const expected = errors.DeniedFieldError.defaultMessage + field;
      assert.strictEqual(result.message, expected);
    });

    it('sets data to denied field', function() {
      const field = '/foo/bar';
      const result = new errors.DeniedFieldError(field);
      assert.strictEqual(result.data, field);
    });
  });


  describe('InvalidTargetError', function() {
    it('sets message with provided target', function() {
      const pointer = '/foo/bar';
      const target = Target.jsonPointer(pointer);
      const result = new errors.InvalidTargetError(target);
      const { defaultMessage } = errors.InvalidTargetError;
      const expected = defaultMessage + pointer;
      assert.strictEqual(result.message, expected);
    });
  });


  describe('UnallowedFieldError', function() {
    it('sets message to default suffixed with field', function() {
      const field = '/foo/bar';
      const result = new errors.UnallowedFieldError(field);
      const expected = errors.UnallowedFieldError.defaultMessage + field;
      assert.strictEqual(result.message, expected);
    });

    it('sets data to denied field', function() {
      const field = '/foo/bar';
      const result = new errors.UnallowedFieldError(field);
      assert.strictEqual(result.data, field);
    });
  });


  describe('RequiredFieldError', function() {
    it('sets message with required fields', function() {
      const fields = ['foo', 'bar'];
      const result = new errors.RequiredFieldError(fields);
      const { defaultMessage } = errors.RequiredFieldError;
      const expected = defaultMessage + JSON.stringify(fields);
      assert.strictEqual(result.message, expected);
    });

    it('sets data to provided fields', function() {
      const fields = ['foo', 'bar'];
      const result = new errors.RequiredFieldError(fields);
      assert.strictEqual(result.data, fields);
    });
  });


  describe('UnsupportedError', function () {
    it('sets message to given value', function () {
      const expected = 'This is a test';
      const result = new errors.UnsupportedError(expected);
      assert.strictEqual(result.message, expected);
    });

    it('sets message to default', function () {
      const result = new errors.UnsupportedError();
      assert.strictEqual(
        result.message,
        errors.UnsupportedError.defaultMessage
      );
    });
  });

});
