# acars-decoder-typescript

[![NPM Version](https://badge.fury.io/js/@airframes%2Facars-decoder.svg)](https://badge.fury.io/js/@airframes%2Facars-decoder)
[![GitHub Actions Workflow Status](https://github.com/airframesio/acars-decoder-typescript/actions/workflows/yarn-test.yml/badge.svg)
](https://github.com/airframesio/acars-decoder-typescript/actions/workflows/yarn-test.yml)
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/airframesio/acars-decoder-typescript?utm_source=oss&utm_medium=github&utm_campaign=airframesio%2Facars-decoder-typescript&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
[![Contributors](https://img.shields.io/github/contributors/airframesio/acars-decoder-typescript)](https://github.com/airframesio/acars-decoder-typescript/graphs/contributors)
[![Activity](https://img.shields.io/github/commit-activity/m/airframesio/acars-decoder-typescript)](https://github.com/airframesio/acars-decoder-typescript/pulse)
[![Discord](https://img.shields.io/discord/1067697487927853077?logo=discord)](http://discord.gg/airframes)

ACARS is an aircraft communications messaging protocol that has been in use worldwide for a few decades. This library exists to specifically decode the text portion of the ACARS message payload.

The library is built around research and discoveries from the [ACARS Message Documentation](https://github.com/airframesio/acars-message-documentation), a community effort to document the details of the ACARS message label/text payload.

It has been written in TypeScript (which compiles to Javascript) and is published as an NPM package.

You are welcome to contribute (please see https://github.com/airframesio/acars-message-documentation where we collaborate to research and document the various types of messages), and while it was primarily developed to power [Airframes](https://app.airframes.io) and [AcarsHub](https://sdr-e.com/docker-acarshub), you may use this library in your own applications freely.

# Installation

Add the `@airframes/acars-decoder` library to your JavaScript or TypeScript project.

With `yarn`:
```
yarn add @airframes/acars-decoder
```

With `npm`:
```
npm install @airframes/acars-decoder
```

# Usage

Documentation coming soon.

# Contributions

Contributions are welcome! Please follow the [ACARS Message Documentation](https://github.com/airframesio/acars-message-documentation) when implementing. Most find that this makes things a lot easier. Submit a Pull Request and we will gratefully review and merge.

# Contributors

| Contributor | Description |
| ----------- | ----------- |
| [Kevin Elliott](https://github.com/kevinelliott) | Primary Airframes contributor |
| [Michael Johnson](https://github.com/johnsom) | Decoder plugins, testing framework |
| [Mark Bumiller](https://github.com/makrsmark) | Decoder plugins, tests, utilities |
