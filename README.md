# EUDCC Validator

This is a PWA validator app for EU Digital Covid Certificates.

# [See it live!](https://eudcc.ojdip.net)

It targets [version 1.3.0 of the DCC spec](https://github.com/ehn-dcc-development/hcert-spec/blob/main/hcert_spec.md). It can parse older DCCs, but signature verification may not work correctly.

## Trust lists

EUDCC Validator uses these trust lists:

- Test environment: https://dgcg-qa.covidbevis.se/tp/trust-list
- Production environment: https://dgcg.covidbevis.se/tp/trust-list

The trust lists are transformed and cached by a CloudFlare worker ([source here](./worker.js)) and the endpoints are:

- Test environment: https://eudcc.tibordp.workers.dev/trust-list/test
- Production environment: https://eudcc.tibordp.workers.dev/trust-list/prod

This is primarily for CORS reasons, as the trust lists do not have appropriate CORS headers in order to be able to use them directly.

## Development

```
yarn start
```

When run locally, the test trust root is used, so app can be tested with sample DCCs from https://github.com/eu-digital-green-certificates/dgc-testdata.

## Production build

```
yarn build
```

The production trust list is used in production build.
