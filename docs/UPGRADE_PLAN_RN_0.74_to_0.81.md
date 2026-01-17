# React Native Upgrade Plan: 0.74.5 → 0.81.5

**Project:** SpotCheck App  
**Current Version:** React Native 0.74.5, Expo SDK 54  
**Target Version:** React Native 0.81.5 (matches Expo SDK 54)  
**Estimated Timeline:** 2-3 weeks  
**Risk Level:** Medium-High (significant version jump)

---

## 📋 Executive Summary

This upgrade resolves the compatibility issues between Expo SDK 54 and React Native 0.74.5. After completion, we will:
- ✅ Remove all workarounds and patches
- ✅ Align with Expo SDK 54 requirements
- ✅ Eliminate manual Gradle file fixes
- ✅ Enable full official support and future compatibility

**Current Problems This Solves:**
- Version mismatch between Expo SDK 54 (expects RN 0.81.5) and current RN 0.74.5
- Patches required for `@react-native/gradle-plugin` (serviceOf, allWarningsAsErrors)
- Patches required for `react-native` (Kotlin version)
- Manual fixes to `settings.gradle` and `app/build.gradle` after each prebuild

---

## 🎯 Phase 1: Preparation & Assessment (Days 1-2)

### 1.1 Environment Requirements

**Before starting, ensure:**
- [ ] Node.js 20.19.4+ (currently check: `node --version`)
- [ ] Xcode 16.1+ for iOS builds
- [ ] Android SDK with API level 36 (Android 16) support
- [ ] Latest Expo CLI: `npm install -g expo-cli@latest`

### 1.2 Pre-Upgrade Checklist

**Backup & Branch:**
- [ ] Create a new branch: `git checkout -b upgrade/rn-0.74-to-0.81`
- [ ] Commit current working state
- [ ] Create a backup tag: `git tag backup-before-rn-upgrade`

**Baseline Testing:**
- [ ] Run full test suite and document results
- [ ] Build both iOS and Android apps successfully
- [ ] Document current bundle sizes
- [ ] Record startup time benchmarks
- [ ] Test critical user flows (camera, authentication, payments, etc.)

**Dependency Audit:**

| Package | Current | Compatible with RN 0.81? | Action Needed |
|---------|---------|---------------------------|---------------|
| `react-native` | 0.74.5 | ❌ | Upgrade to 0.81.5 |
| `expo` | ^54.0.31 | ✅ | Keep (already compatible) |
| `react-native-gesture-handler` | ~2.16.0 | ⚠️ | Check - may need upgrade |
| `react-native-reanimated` | ~3.10.0 | ⚠️ | Check - may need upgrade |
| `react-native-mlkit-ocr` | ^0.3.0 | ⚠️ | **VERIFY** - critical for your app |
| `react-native-purchases` | ^8.1.0 | ⚠️ | Check - may need upgrade |
| `@react-native-async-storage/async-storage` | 1.23.1 | ⚠️ | Check - may need upgrade |
| `@shopify/flash-list` | ^1.6.3 | ⚠️ | Check compatibility |
| `react` | 18.2.0 | ⚠️ | May need React 19 (check RN 0.81 requirements) |

**⚠️ Critical Dependencies to Verify:**
- `react-native-mlkit-ocr` - Core feature for document scanning
- `react-native-purchases` - RevenueCat integration for payments
- All Expo modules (should be fine with SDK 54)

---

## 🚀 Phase 2: Intermediate Version Upgrades (Days 3-7)

**Strategy:** Incremental upgrades reduce risk. Jump directly to 0.81.5 if you prefer, but incremental is safer.

### 2.1 Upgrade Path Options

**Option A: Incremental (Recommended for Large Apps)**
```
0.74.5 → 0.76 → 0.79 → 0.80 → 0.81.5
```
**Pros:** Easier to isolate issues, smaller changes  
**Cons:** Takes longer (5-7 days)

**Option B: Direct (Faster, Higher Risk)**
```
0.74.5 → 0.81.5
```
**Pros:** Faster (2-3 days)  
**Cons:** Harder to debug, multiple breaking changes at once

**Recommendation:** Start with Option B (direct). If issues arise, step back to Option A.

### 2.2 Direct Upgrade Steps (0.74.5 → 0.81.5)

#### Step 1: Update React Native Core

```bash
# Remove patches temporarily
rm -rf patches/

# Update React Native
npm install react-native@0.81.5

# Update React (check if RN 0.81 requires React 19)
npm install react@18.3.1  # or 19.x if required

# Update Expo dependencies to match
npx expo install --fix
```

#### Step 2: Update React Native Community Packages

```bash
# Update common packages
npm install @react-native-async-storage/async-storage@latest
npm install @react-native-community/netinfo@latest
npm install react-native-gesture-handler@latest
npm install react-native-reanimated@latest
npm install react-native-safe-area-context@latest
npm install react-native-screens@latest
```

#### Step 3: Update Third-Party Native Modules

```bash
# ⚠️ CRITICAL: Check compatibility first!
# Visit each package's GitHub for RN 0.81 compatibility

# RevenueCat
npm install react-native-purchases@latest

# ML Kit OCR - CHECK BEFORE UPGRADING
# Visit: https://github.com/a7medev/react-native-mlkit-ocr
# May need to check if it supports New Architecture

# Flash List
npm install @shopify/flash-list@latest
```

#### Step 4: Clean and Regenerate Native Projects

```bash
# Clean everything
rm -rf node_modules
rm -rf ios/Pods ios/Podfile.lock
rm -rf android/.gradle android/app/build
rm -rf .expo

# Reinstall
npm install

# Regenerate native projects
npx expo prebuild --clean
```

---

## ⚠️ Phase 3: Breaking Changes & Fixes (Days 8-12)

### 3.1 New Architecture Migration

**Status Check:**
- [ ] Verify if app uses New Architecture (check `gradle.properties` for `newArchEnabled=true`)
- [ ] Test all native modules work with New Architecture

**If Legacy Architecture:**
- RN 0.80 freezes Legacy Architecture
- RN 0.82 removes it completely
- **Action:** Migrate to New Architecture before 0.82

### 3.2 SafeAreaView Deprecation

**Breaking Change:** Built-in `<SafeAreaView>` is deprecated in RN 0.81.

**Find all usages:**
```bash
grep -r "SafeAreaView" app/ components/
```

**Migration:**
Replace:
```typescript
import { SafeAreaView } from 'react-native';
```

With:
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
```

**Files to check:** (Search your codebase)
- All screen components
- Layout components
- Any full-screen views

### 3.3 Deep Imports Removal

**Breaking Change:** Deep imports from `react-native/Libraries/...` are deprecated.

**Find deep imports:**
```bash
grep -r "react-native/Libraries" app/ components/
```

**Common replacements:**
- `react-native/Libraries/Alert/Alert` → `import { Alert } from 'react-native'`
- `react-native/Libraries/Components/Text/Text` → `import { Text } from 'react-native'`

### 3.4 Android 16 (API 36) Changes

**Update `app/build.gradle`:**
```gradle
android {
    compileSdkVersion 36
    targetSdkVersion 36
    minSdkVersion 24  // Updated from 23
}
```

**Edge-to-Edge UI:**
- Status bar and navigation bar behavior changes
- Test immersive modes, full-screen videos
- Check camera preview, document scanning UI

### 3.5 Metro Config Changes

**Check `metro.config.js`:**
- Custom `resolveRequest` or `getModulesRunBeforeMainModule` may need updates
- Verify bundler still works: `npx expo start --clear`

### 3.6 Kotlin/Gradle Updates

**No manual patches needed!** RN 0.81.5 includes:
- Kotlin 2.0+ by default
- Proper Gradle 8.14+ compatibility
- KSP support out of the box

**Remove all patches:**
- [ ] Delete `patches/@react-native+gradle-plugin+*.patch`
- [ ] Delete `patches/react-native+*.patch`
- [ ] Remove `postinstall` script from `package.json` (or keep it empty)

**Remove manual Gradle fixes:**
- [ ] Delete custom `settings.gradle` fixes (prebuild will generate correct version)
- [ ] Delete `app/build.gradle` workarounds (use default generated version)

### 3.7 TypeScript Strict API (Optional)

**If using TypeScript:**
- RN 0.80 introduces strict JS API mode (opt-in)
- Enable in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "react-native": {
      "strictApi": true
    }
  }
}
```

---

## 🧪 Phase 4: Testing & Validation (Days 13-15)

### 4.1 Build Verification

- [ ] iOS builds successfully: `npx expo run:ios`
- [ ] Android builds successfully: `npx expo run:android`
- [ ] No Gradle/Kotlin compilation errors
- [ ] No pod install errors
- [ ] No Metro bundler errors

### 4.2 Functional Testing

**Core Features:**
- [ ] Authentication (Apple, Google, Email)
- [ ] Document scanning (ML Kit OCR)
- [ ] Camera capture
- [ ] AI document analysis
- [ ] Payment/subscription flow (RevenueCat)
- [ ] Calendar integration
- [ ] Biometric authentication
- [ ] Network status handling
- [ ] Offline mode

**Navigation:**
- [ ] Tab navigation works
- [ ] Deep linking works
- [ ] Back button behavior (Android)

**Native Modules:**
- [ ] All Expo modules function correctly
- [ ] Camera permissions work
- [ ] Calendar permissions work
- [ ] Biometric authentication works
- [ ] ML Kit OCR processes images correctly

### 4.3 Performance Testing

- [ ] App startup time (compare with baseline)
- [ ] Memory usage (check for leaks)
- [ ] Bundle size (compare with baseline)
- [ ] Camera preview performance
- [ ] Image processing performance

### 4.4 Platform-Specific Testing

**iOS:**
- [ ] Test on iOS 15.1+ devices
- [ ] Safe area handling on notch devices
- [ ] Status bar appearance
- [ ] Keyboard handling

**Android:**
- [ ] Test on Android 7+ devices
- [ ] Edge-to-edge UI behavior (Android 16)
- [ ] Back gesture handling
- [ ] Navigation bar behavior
- [ ] Status bar theming

---

## 🧹 Phase 5: Cleanup & Documentation (Day 16)

### 5.1 Remove Workarounds

- [ ] Delete `patches/` directory
- [ ] Remove `postinstall` script (or clear it)
- [ ] Delete manual Gradle fixes
- [ ] Remove version-guarded code
- [ ] Clean up deprecated API usage

### 5.2 Documentation Updates

- [ ] Update `README.md` with new requirements
- [ ] Update `docs/IMPLEMENTATION_GUIDE.md`
- [ ] Document any breaking changes for team
- [ ] Update CI/CD documentation

### 5.3 Final Verification

- [ ] Run full test suite
- [ ] Build production bundles
- [ ] Verify EAS build works: `eas build --platform android --profile production`

---

## 📊 Risk Assessment & Mitigation

### High-Risk Areas

1. **`react-native-mlkit-ocr`**
   - **Risk:** Core feature dependency
   - **Mitigation:** 
     - Check GitHub issues for RN 0.81 compatibility
     - Test thoroughly after upgrade
     - Have fallback plan (alternative OCR library)

2. **New Architecture Migration**
   - **Risk:** Some native modules may not support it
   - **Mitigation:** 
     - Test all native features extensively
     - Verify Expo modules are compatible (should be)
     - Keep Legacy Architecture as fallback temporarily if needed

3. **SafeAreaView Changes**
   - **Risk:** UI layout issues
   - **Mitigation:** 
     - Search and replace all usages
     - Test on all device types (notch, no notch)
     - Visual regression testing

### Medium-Risk Areas

1. **RevenueCat Integration**
   - **Risk:** Payment flow disruption
   - **Mitigation:** Test purchase flow thoroughly in sandbox

2. **Edge-to-Edge UI (Android 16)**
   - **Risk:** Layout issues on newer Android devices
   - **Mitigation:** Test on Android 14+ devices

---

## 🚨 Rollback Plan

**If upgrade fails:**

1. **Immediate Rollback:**
   ```bash
   git checkout backup-before-rn-upgrade
   npm install
   npx expo prebuild --clean
   ```

2. **Partial Rollback:**
   - Keep some dependency upgrades if beneficial
   - Revert only problematic changes
   - Document issues for next attempt

3. **Alternative:**
   - Stay on RN 0.74.5 but downgrade Expo SDK to 53
   - Requires separate compatibility check

---

## 📝 Post-Upgrade Checklist

After successful upgrade:

- [ ] All patches removed
- [ ] No manual Gradle fixes needed
- [ ] `expo prebuild --clean` works without manual fixes
- [ ] All tests passing
- [ ] Production builds working
- [ ] Team documentation updated
- [ ] CI/CD pipelines updated
- [ ] Monitor crash reports for 1 week post-release

---

## 🎯 Success Criteria

The upgrade is successful when:

1. ✅ App builds without patches or manual fixes
2. ✅ All core features work correctly
3. ✅ No regressions in user-facing functionality
4. ✅ Performance is equal or better than before
5. ✅ `expo prebuild --clean` works without manual intervention
6. ✅ Production builds succeed on EAS
7. ✅ No critical bugs introduced

---

## 📚 Resources

- [React Native 0.81 Release Notes](https://reactnative.dev/blog/2025/08/12/react-native-0.81)
- [React Native 0.80 Release Notes](https://reactnative.dev/blog/2025/06/12/react-native-0.80)
- [Expo SDK 54 Documentation](https://docs.expo.dev/)
- [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)
- [New Architecture Documentation](https://reactnative.dev/docs/the-new-architecture/landing-page)

---

## ⏱️ Estimated Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Preparation | 1-2 days | ⏳ Pending |
| Phase 2: Core Upgrade | 2-3 days | ⏳ Pending |
| Phase 3: Breaking Changes | 3-4 days | ⏳ Pending |
| Phase 4: Testing | 2-3 days | ⏳ Pending |
| Phase 5: Cleanup | 1 day | ⏳ Pending |
| **Total** | **9-13 days** | |

**Add 3-5 days buffer for unexpected issues = 2-3 weeks total**

---

**Document Version:** 1.0  
**Created:** 2025-01-17  
**Last Updated:** 2025-01-17
