# lib

## Getting started

```bash
# Install the required dependencies
yarn
```

If you're working in this repo, you're likely also working in [web](https://github.com/shapeshift/web). Run the following command to automatically `yarn link` all the packages in this repo so they can also be linked in `web`

```bash
➜ yarn link-packages
yarn run v1.22.15
$ node scripts/linkPackages.js link
success Registered "@bithighlander/asset-service".
info You can now run `yarn link "@bithighlander/asset-service"` in the projects where you want to use this package and it will be used instead.
success Registered "@bithighlander/chain-adapters".
info You can now run `yarn link "@bithighlander/chain-adapters"` in the projects where you want to use this package and it will be used instead.
success Registered "@bithighlander/market-service".
info You can now run `yarn link "@bithighlander/market-service"` in the projects where you want to use this package and it will be used instead.
success Registered "@bithighlander/swapper".
info You can now run `yarn link "@bithighlander/swapper"` in the projects where you want to use this package and it will be used instead.
success Registered "@bithighlander/types".
info You can now run `yarn link "@bithighlander/types"` in the projects where you want to use this package and it will be used instead.

✨  Done in 0.47s.
```

Similary you can unlink packages, which can be useful for debugging failing CI runs
```bash
➜ yarn unlink-packages
yarn run v1.22.15
$ node scripts/linkPackages.js unlink
success Unregistered "@bithighlander/asset-service".
info You can now run `yarn unlink "@bithighlander/asset-service"` in the projects where you no longer want to use this package.
success Unregistered "@bithighlander/chain-adapters".
info You can now run `yarn unlink "@bithighlander/chain-adapters"` in the projects where you no longer want to use this package.
success Unregistered "@bithighlander/market-service".
info You can now run `yarn unlink "@bithighlander/market-service"` in the projects where you no longer want to use this package.
success Unregistered "@bithighlander/swapper".
info You can now run `yarn unlink "@bithighlander/swapper"` in the projects where you no longer want to use this package.
success Unregistered "@bithighlander/types".
info You can now run `yarn unlink "@bithighlander/types"` in the projects where you no longer want to use this package.

✨  Done in 0.37s.
```

## Testing

Bug fixes and features should always come with tests, when applicable. Test files should live next to the file they are testing. Before submitting your changes in a pull request, always run the full test suite.

To run the test suite:

```bash
# Runs the full test suite
yarn test

# Runs the full w/ the watch flag and coverage reports
yarn test:dev
```

**Helpful Testing Process**

One technique that can helpful when writing tests, is to reference the coverage report for the file/function/feature you're testing. To do this, run `yarn test:dev` from your terminal. This will generate a coverage report for the project in the `coverage` directory. To view the report, open the file `coverage/lcov-report/index.html`.

## Contributing

Please see the [Contributing Guidlines](CONTRIBUTING.md) document for this repo's specific contributing guidelines.
