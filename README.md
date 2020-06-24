<h1 align="center">Welcome to faunadb-real-time 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
  <a href="https://twitter.com/potato\_potaro" target="_blank">
    <img alt="Twitter: potato\_potaro" src="https://img.shields.io/twitter/follow/potato_potaro.svg?style=social" />
  </a>
</p>

> Higher-Order-Function/Wrapper for &#34;smartly&#34; polling FaunaDB.

## Install

```sh
npm i faunadb-real-time
```

or

```sh
yarn add faunadb-real-time
```

## How to Use

```js
const { withRealTimeMethods } = require('faunabd-real-time');
const { Client } = require('faunadb');

const client = withRealTimeMethods(new Client({
  secret: '<FAUNA_SECRET>'
}));

// Index must return a FaunaDB TS as the first element.
// Additionally, returning the Document's Ref afterwards...
// is useful for reading the entire Document, after mapping (as seen below).
const subscribable = client
  .livePaginate(
    q.Match(q.Index("<INDEX_RETURNING_TS_FIRST>")),
    {}, // param_object for FQL's Paginate
    { // default options for specifying polling frequencies (in milliseconds)
      activeMs: 5000,
      passiveMs: 10000,
      passiveAfter: 10000
    }
  )
  .map((arr) => q.Get(q.Select([1], arr)))
  
const unsubscribeA = subscribable
  .subscribe(data => console.log('subscription A', data));

const unsubscribeB = subscribable
  .subscribe(data => console.log('subscription B', data));
```

## Author

👤 **Taro <taro.s.chiba@gmail.com>**

* Website: cooksto.com
* Twitter: [@potato_potaro](https://twitter.com/potato\_potaro)
* Github: [@potatopotaro](https://github.com/potatopotaro)
* LinkedIn: [@taro-woollett-chiba-25a802125](https://linkedin.com/in/taro-woollett-chiba-25a802125)

## Show your support

Give a ⭐️ if this project helped you!

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_