# spleen-mongodb

The [`spleen`](https://www.npmjs.com/package/spleen) module provides high-level abstractions for dynamic filters.  This module will convert a `spleen` [`Filter`](https://www.npmjs.com/package/spleen#class-filter) into a [MongoDB Query Filter Document](https://docs.mongodb.com/manual/core/document/#document-query-filter) object.

__Contents__
* [Usage](#usage)
* [API](#api)

## Usage

Add `spleen-mongodb` to your `package.json` file's `dependencies`:

```sh
$ npm install spleen-mongodb -S
```

Then use it in your code:

```js
const splongodb = require('spleen-mongodb');
const spleen = require('spleen');

const filter = spleen.parse('/foo/bar eq 42 and /baz in [1,2,3] or /qux gt 0');
const result = splongodb.convert(filter);

console.log(result);
// {
//   $or: [
//     {
//       "foo.bar": 42,
//       "baz": { "$in": [1, 2, 3,] }
//     },
//     {
//       "qux": { "$gt": 0 }
//     }
//   ]
// }
```

## API

The `spleen-mongodb` module provides the following interface:

* __Properties__

  + `errors`: an object that contains references to the various possible errors thrown by `spleen-mongodb`.  This object has the following keys:

    - `ConvertError`: a general error thrown when `spleen-mongodb` is unable to convert a given `Filter` instance into a Query Filter Document object.  This should generally never happen, and is here as a safeguard in the event a `Filter` instance is corrupted.

    - `DeniedFieldError`: thrown when a field is encountered that has been explicitly black-listed by the `deny` option.

    - `InvalidTargetError`: thrown if a target is encountered with an invalid format.  For example, if a segment of the path contains disallowed characters.

    - `NonallowedFieldError`: thrown when a field is encountered that not been white-listed by the `allow` option.

    - `RequiredFieldError`: thrown when a field that has been required by the `require` option is not present in the given `Filter`.

  + `Strategy`: a reference to the [`Strategy`](#class-strategy) class.

* __Methods__

  + `convert(filter [, strategy])`: converts an instance of `spleen`'s `Filter`' class into an MongoDB Query Filter Document object.

    _Parameters_

    - `filter`: _(required)_ the instance of `Filter` to convert.

    - `strategy`: _(optional)_ an instance of `Strategy`.

    This method returns an object with the following key:

    - `fields`: an array containing all of the fields (in [RFC 6901 JSON pointer](https://tools.ietf.org/html/rfc6901) format) included in the filter.

    - `value`: an object containing the MongoDB Filter Query Document.

### Class: `Strategy`

Compiles a `spleen` to MongoDB Query Filter Document conversion strategy, which is easily read by the `convert()` method.

* `new Strategy(settings)`

  Creates a new instance of `Strategy`.

  _Parameters_

  + `settings`: _(required)_ an object that controls various aspects of the conversion process.  This object can have the keys:

    - `allow`: _(optional)_ an array of RFC 6901 JSON pointer strings that are allowed to be in a `Filter`'s list of targets.  Any targets in a `Filter` instance not found in the `allow` or `require` lists will result in an error being thrown.  This list functions as a white list, and can only be present if `deny` is absent.  An empty array is the logical equivalent of the `allow` key being absent.

    - `deny`: _(optional)_ an array of RFC 6901 JSON pointer strings that are not allowed to be in a `Filter`'s list of targets.  Any targets in a `Filter` instance found in this list will result in an error being thrown.  This list functions as a black list, and can only be present if `allow` is absent.

    - `require`: _(optional)_ an array of RFC 6901 JSON pointer strings that are required to be in a `Filter`'s list of targets (`Filter.prototype.targets`).  If a required target is missing, an error is thrown.
