# Temporary Mobile EAS binding implementation note

This branch hardens the existing Mobile release resource and signed-build workflows so a successful Expo lookup is not accepted until the returned EAS `fullName` and project `ID` match the protected FanMind owner, `fanmind-mobile` slug and exact project ID.

The implementation is repository-only and does not create credentials, queue a build, submit an app, publish an update or mutate Expo, Supabase, Apple or Google resources.
