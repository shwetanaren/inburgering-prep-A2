# Security Notes

## npm audit findings in Expo projects

This project uses Expo SDK 54. The `expo` package includes tooling dependencies
(`@expo/cli`, `@expo/metro-config`, `@react-native/dev-middleware`, `glob`,
`minimatch`) that npm classifies as production dependencies even though they are
used only during development/build.

As a result, `npm audit` may report high-severity issues even with
`--omit=dev`. These do not ship into the mobile app binary and do not impact
runtime behavior on devices.

### Policy

- We do **not** use `npm audit fix --force` because it can downgrade Expo and
  break SDK compatibility.
- We **only** upgrade Expo within the same SDK when a patch release updates
  these transitive dependencies.
- If a strict audit gate is required, prefer running `npm audit --omit=dev`
  and evaluate findings in the context of build-time tooling.

