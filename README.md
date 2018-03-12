# spleen-mongodb

The [`spleen`](https://www.npmjs.com/package/spleen) module provides high-level abstractions for dynamic filters.  This module will convert a `spleen` [`Filter`](https://www.npmjs.com/package/spleen#class-filter) into a [MongoDB Query Filter Document](https://docs.mongodb.com/manual/core/document/#document-query-filter) object.

__Contents__
* [Usage](#usage)
* [API](#api)
* [Security](#security)

## Usage

Add `spleen-mongodb` to your `package.json` file's `dependencies`:

```sh
$ npm install spleen-mongodb -S
```

Then use it in your code:

```js
const spleen = require('spleen');
const splongo = require('spleen-mongodb');

const filter = spleen.parse('/foo/bar eq 42 and /baz in [1,2,3] or /qux gt 0');
const result = splongo.convert(filter);

console.log(result.value);
// {
//   "$or": [
//     {
//       "$and": [
//         { "foo.bar": 42 },
//         { "baz": { "$in": [1, 2, 3,] } }
//       ]
//     },
//     { "qux": { "$gt": 0 } }
//   ]
// }
```

## API

The `spleen-mongodb` module provides the following interface.

### `splongo.convert(filter [, strategy])`

Converts an instance of [`spleen`](https://www.npmjs.com/package/spleen)'s [`Filter`](https://www.npmjs.com/package/spleen#class-filter) class into an MongoDB Query Filter Document object.

__Parameters__

* `filter`: _(required)_ the instance of `Filter` to convert.

* `strategy`: _(optional)_ an instance of [`Strategy`](#splongostrategy).

__Returns__

An object with the following keys:

* `fields`: an array of [RFC 6901 JSON pointer](https://tools.ietf.org/html/rfc6901) values, representing the fields referenced by the converted `Fitler`.

* `value`: the MongoDB Query Filter Document.

----------

### `splongo.errors.ConvertError`

A general error thrown when `spleen-mongodb` is unable to convert a given [`Filter`](https://www.npmjs.com/package/spleen#class-filter) instance into a Query Filter Document object.  This should generally never happen, and is here as a safeguard in the event a `Filter` instance is corrupted.

----------

### `splongo.errors.DeniedFieldError`

An error thrown when a field is encountered that has been explicitly black-listed by the `deny` option.

----------

### `splongo.errors.InvalidTargetError`

An error thrown if a target is encountered with an invalid format.  For example, if a segment of the path contains reserved characters.

----------

### `splongo.errors.UnallowedFieldError`

An error thrown when a field is encountered that has not been white-listed by the `allow` option.

----------

### `splongo.errors.RequiredFieldError`

An error thrown when a [`Filter`](https://www.npmjs.com/package/spleen#class-filter) instance is passed to [`convert()`](#splongoconvertfilter-strategy) missing a required field.

----------

### `splongo.Strategy`

A class that represents a conversion strategy.  Instances are meant to be cached in memory to prevent having to recompute this information with every call to [`convert()`](#splongoconvertfilter-strategy).

#### `Strategy.prototype.constructor([options])`

Create a new instance of `Strategy`.

* `options`: _(optional)_ an object that provides conversion options. This object can have the keys:

  + `allow`: _(optional)_ an array of [RFC 6901 JSON pointer](https://tools.ietf.org/html/rfc6901) strings that are allowed to be in a `Filter`'s list of targets.  Any targets in a [`Filter`](https://www.npmjs.com/package/spleen#class-filter) instance not found in the `allow` or `require` lists will result in an error being thrown.  This list functions as a white list, and can only be present if `deny` is absent.  An empty array is the logical equivalent of the `allow` key being absent.

  + `deny`: _(optional)_ an array of RFC 6901 JSON pointer strings that are not allowed to be in a `Filter`'s list of targets.  Any targets in a `Filter` instance found in this list will result in an error being thrown.  This list functions as a black list, and can only be present if `allow` is absent.

  + `require`: _(optional)_  object that specifies required field target behavior. This object can have the following keys:

    - `fields`: _(optional)_ an array of RFC 6901 JSON pointer strings that are required to be in a `Filter`'s list of targets (`Filter.prototype.targets`).  If a required target is missing, an error is thrown.  If this key is omitted or empty, there are assumed to be no required fields.

    - `which`: _(optional)_ a string specifying which fields are required to be in a given `Filter`. This can be either `any` or `all`. If omitted, this value defaults to `any`.

## Security

The combination of `spleen` and `spleen-mongodb` add a number of layers of protection to prevent [NoSQL-injection attacks](https://www.owasp.org/index.php/Testing_for_NoSQL_injection) vulnerabilities.  Either `spleen` will refuse to parse a given filter, or `spleen-mongodb` will throw an error if reserved MongoDB tokens are encountered.

That said, there are a couple of other things to consider:

1. It is advised that implementers make use of the [`Strategy`](#splongostrategy) class' `allow`/`deny` and `require` functionality.  The idea is to prevent a DoS attack vector by ensuring expensive queries against un-indexed fields cannot be executed.

2. The `spleen` and `spleen-mongodb` libraries do not, and cannot, ensure queries are not executed against data to which a user lacks sufficient permission.  When required, implementers should append static authorization checks to all queries taken as input.
