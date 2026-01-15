# SpotCheck Technical Optimization Backlog

**Status:** Post-Launch / V1.1 Candidates  
**Goal:** Improve speed, stability, and code quality without adding new features.  
**Last Updated:** 2024

---

## Table of Contents

1. [Code Hygiene & Bundle Size](#1-code-hygiene--bundle-size-the-spring-cleaning)
2. [Advanced List Rendering](#2-advanced-list-rendering-for-100-items)
3. [Network Efficiency](#3-network-efficiency-saving-data)
4. [Memory Management](#4-memory-management)
5. [Resilience & Monitoring](#5-resilience--monitoring)
6. [Platform Specific Polish](#6-platform-specific-polish)

---

## 1. Code Hygiene & Bundle Size (The "Spring Cleaning")

### Asset Optimization
**Priority:** Medium  
**Impact:** Reduces app download size, faster installs

- [ ] Convert static PNG assets (splash screens, onboarding images) to WebP format
  - **Current:** PNG files in `assets/` directory
  - **Target:** WebP format with fallback for older devices
  - **Expected Savings:** 30-50% reduction in asset size
  - **Implementation:**
    - Use `sharp` or online converter to convert PNG → WebP
    - Update `app.json` to reference WebP files
    - Test on iOS and Android to ensure compatibility

### Dependency Audit
**Priority:** High  
**Impact:** Smaller bundle size, faster app startup

- [ ] Run `npm prune` to remove unused dependencies
- [ ] Audit `package.json` for unused libraries
- [ ] Replace heavy libraries with lighter alternatives where possible
- [ ] Enable tree-shaking for large libraries
- [ ] Use `npx depcheck` to identify unused dependencies
- [ ] Consider replacing:
  - Check if `lucide-react-native` is still needed (we use NativeIcon now)
  - Verify all `expo-*` packages are actually used

### Strict Typing
**Priority:** Medium  
**Impact:** Catches potential null pointer crashes, improves code quality

- [ ] Gradually enable `strict: true` in `tsconfig.json`
- [ ] Fix TypeScript errors incrementally
- [ ] Add proper null checks for all potentially undefined values
- [ ] Use TypeScript's strict null checks to prevent runtime errors
- [ ] Focus areas:
  - Database query results (may be null)
  - User profile data (may not exist)
  - Edge Function responses (may fail)

### Linting
**Priority:** Low  
**Impact:** Consistent code style, catches common errors

- [ ] Set up ESLint with React Native rules
- [ ] Configure Prettier for automatic formatting
- [ ] Add pre-commit hooks (Husky) to enforce linting
- [ ] Set up CI/CD to fail builds on lint errors
- [ ] Recommended ESLint plugins:
  - `@typescript-eslint/eslint-plugin`
  - `eslint-plugin-react-native`
  - `eslint-plugin-react-hooks`

---

## 2. Advanced List Rendering (For 100+ Items)

### FlashList Optimization
**Priority:** Medium  
**Impact:** Smooth scrolling with large datasets

- [ ] Add `getItemType` prop to FlashList if different card layouts are introduced
  - **Current:** All items use the same layout
  - **Future:** If we add different card types (e.g., "Featured Item"), use `getItemType` to help FlashList recycle components faster
  - **Implementation:**
    ```tsx
    <FlashList
      getItemType={(item) => item.isFeatured ? 'featured' : 'standard'}
      // ...
    />
    ```

- [ ] Enable `removeClippedSubviews` on long lists (Android mainly)
  - **Current:** Not enabled
  - **Target:** Enable for lists with 50+ items
  - **Impact:** Detaches off-screen views from memory completely
  - **Implementation:**
    ```tsx
    <FlashList
      removeClippedSubviews={true}
      // ...
    />
    ```

### Category Picker Virtualization
**Priority:** Low  
**Impact:** Smooth horizontal scrolling if category list grows

- [ ] If Category Picker (horizontal scroll) gets laggy, wrap it in FlashList
  - **Current:** Uses `ScrollView` with horizontal scrolling
  - **Target:** Replace with `FlashList` with `horizontal={true}`
  - **When to implement:** If category list exceeds 20 items or shows performance issues
  - **Implementation:**
    ```tsx
    <FlashList
      data={categories}
      horizontal
      renderItem={renderCategoryChip}
      estimatedItemSize={80}
    />
    ```

---

## 3. Network Efficiency (Saving Data)

### Request Deduplication
**Priority:** High  
**Impact:** Prevents duplicate API calls, saves data and battery

- [ ] Ensure the app doesn't fire the same API call twice if the user double-taps a button
  - **Current:** No deduplication logic
  - **Target:** Implement request deduplication for:
    - Scan button (prevent double-tap during OCR)
    - Send message button (prevent duplicate chat requests)
    - Save item button (prevent duplicate saves)
  - **Implementation:**
    - Use a request queue or debounce mechanism
    - Track in-flight requests and ignore duplicates
    - Add loading states to disable buttons during requests

### Retry Logic with Exponential Backoff
**Priority:** Medium  
**Impact:** Better handling of network failures, improved user experience

- [ ] Implement "Exponential Backoff" for failed API calls
  - **Current:** Basic retry logic in queryClient (retry: 1)
  - **Target:** Exponential backoff: retry in 1s, then 2s, then 4s
  - **Use cases:**
    - OCR failures (network timeout)
    - Edge Function failures (Gemini API timeout)
    - Supabase query failures (connection issues)
  - **Implementation:**
    ```typescript
    const retryDelay = (attemptIndex: number) => 
      Math.min(1000 * 2 ** attemptIndex, 30000);
    ```

### Background Refetch Control
**Priority:** Low  
**Impact:** Saves battery and data

- [ ] Add `refetchOnWindowFocus: false` to specific low-priority queries
  - **Current:** Already set globally in queryClient
  - **Target:** Fine-tune per query:
    - Profile data: Can refetch on focus (changes infrequently)
    - Items list: Don't refetch on focus (user just saw it)
    - Chat messages: Refetch on focus (new messages possible)
  - **Implementation:**
    ```typescript
    useQuery({
      queryKey: ['items', userId],
      refetchOnWindowFocus: false, // Already cached, no need to refetch
      // ...
    });
    ```

---

## 4. Memory Management

### Periodic Cache Clearing
**Priority:** Medium  
**Impact:** Prevents app from using excessive memory

- [ ] Implement logic to clear the expo-image cache if it exceeds 500MB
  - **Current:** No cache size management
  - **Target:** Monitor cache size and clear old entries
  - **Implementation:**
    - Use `expo-image` cache API to check size
    - Clear cache when app starts if > 500MB
    - Clear oldest entries first (LRU strategy)
  - **Code:**
    ```typescript
    import { clearMemoryCache, clearDiskCache } from 'expo-image';
    
    // On app start or periodically
    const cacheSize = await getCacheSize();
    if (cacheSize > 500 * 1024 * 1024) {
      await clearMemoryCache();
      await clearDiskCache();
    }
    ```

### Large Image Chunking
**Priority:** Low  
**Impact:** Handles edge cases with very large images

- [ ] If users scan 12MB+ images (rare), process them in chunks or enforce a stricter max-size pre-check
  - **Current:** Max width 1080px, 0.7 quality compression
  - **Target:** Add file size check before processing
  - **Implementation:**
    - Check file size before OCR
    - If > 10MB, show warning and suggest resizing
    - Or process in chunks for very large images
  - **Code:**
    ```typescript
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
      // Show warning or enforce stricter compression
    }
    ```

---

## 5. Resilience & Monitoring

### Crash Reporting (Sentry)
**Priority:** High  
**Impact:** Catch production crashes, improve stability

- [ ] Integrate Sentry to catch crashes in production
  - **Current:** No crash reporting
  - **Target:** Full Sentry integration
  - **Implementation:**
    - Install `@sentry/react-native`
    - Configure DSN and environment
    - Add error boundaries with Sentry
    - Track custom events (scan success/failure, paywall views)
  - **Setup:**
    ```bash
    npm install @sentry/react-native
    npx @sentry/wizard -i reactNative
    ```
  - **Configuration:**
    - Add to `app/_layout.tsx` or `ErrorBoundary.tsx`
    - Filter sensitive data (no OCR text, no user emails)
    - Set up release tracking

### Token Rotation
**Priority:** High  
**Impact:** Prevents unexpected logouts, better UX

- [ ] Implement secure token refresh logic before the session expires
  - **Current:** Supabase handles token refresh automatically
  - **Target:** Proactive token refresh before expiry
  - **Implementation:**
    - Monitor token expiry time
    - Refresh token when < 5 minutes remaining
    - Handle refresh failures gracefully
    - Show user-friendly message if refresh fails
  - **Code:**
    ```typescript
    // In AuthContext or lib/supabase.ts
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        // Token refreshed successfully
      }
      if (event === 'SIGNED_OUT') {
        // Handle sign out
      }
    });
    ```

### Unit Tests
**Priority:** Medium  
**Impact:** Prevents regressions, ensures math correctness

- [ ] Write tests for critical utility functions
  - **Target functions:**
    - `calculateDaysUntilExpiry()` - Urgency badge logic
    - `calculateTotalSavings()` - Savings calculation
    - `checkVehicleTax()` - Vehicle tax logic (when implemented)
    - `mapCategoryToDisplay()` - Category mapping
  - **Testing framework:** Jest + React Native Testing Library
  - **Implementation:**
    ```typescript
    // __tests__/utils.test.ts
    describe('calculateDaysUntilExpiry', () => {
      it('should return correct days for future date', () => {
        const date = new Date();
        date.setDate(date.getDate() + 10);
        expect(calculateDaysUntilExpiry(date.toISOString())).toBe(10);
      });
      // ... more tests
    });
    ```

---

## 6. Platform Specific Polish

### Android Back Button
**Priority:** Medium  
**Impact:** Consistent navigation experience

- [ ] Ensure the hardware back button behaves consistently on all nested screens
  - **Current:** May not handle back button on all screens
  - **Target:** Proper back button handling throughout app
  - **Implementation:**
    - Use `useFocusEffect` from `@react-navigation/native`
    - Handle back button press on modal screens
    - Prevent back navigation on critical screens (e.g., during scan)
  - **Code:**
    ```typescript
    import { BackHandler } from 'react-native';
    
    useEffect(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // Handle back button
        return true; // Prevent default
      });
      return () => backHandler.remove();
    }, []);
    ```

### iPad Support
**Priority:** Low  
**Impact:** Better experience on iPad devices

- [ ] Ensure the layout doesn't "stretch" weirdly if opened on an iPad
  - **Current:** Locked to portrait, but may not handle iPad sizes well
  - **Target:** Proper layout scaling for iPad
  - **Implementation:**
    - Use `useSafeAreaInsets` consistently
    - Test on iPad simulator
    - Add max-width constraints for very wide screens
    - Ensure text doesn't become too wide (readability)
  - **Code:**
    ```typescript
    import { useSafeAreaInsets } from 'react-native-safe-area-context';
    
    const insets = useSafeAreaInsets();
    // Use insets for padding/margins
    ```

---

## Implementation Priority Matrix

### High Priority (Do First)
1. ✅ **Database Indexes** - Already implemented in Packet 13.0
2. ✅ **Query Client Optimization** - Already implemented in Packet 13.0
3. **Request Deduplication** - Prevents duplicate API calls
4. **Crash Reporting (Sentry)** - Critical for production monitoring
5. **Token Rotation** - Prevents unexpected logouts

### Medium Priority (Do Next)
1. **Dependency Audit** - Reduces bundle size
2. **FlashList Optimization** - Better performance with large lists
3. **Retry Logic** - Better error handling
4. **Periodic Cache Clearing** - Memory management
5. **Android Back Button** - Platform polish

### Low Priority (Nice to Have)
1. **Asset Optimization (WebP)** - Smaller download size
2. **Strict Typing** - Code quality
3. **Linting Setup** - Code consistency
4. **Category Picker Virtualization** - Only if needed
5. **iPad Support** - Edge case handling
6. **Large Image Chunking** - Edge case handling
7. **Unit Tests** - Long-term code quality

---

## Quick Wins (High Impact, Low Effort)

1. **Run `npm prune`** - Remove unused dependencies (5 minutes)
2. **Add `removeClippedSubviews`** - Enable on FlashList (1 minute)
3. **Add request deduplication** - Disable buttons during requests (30 minutes)
4. **Set up ESLint** - Automated code quality (1 hour)
5. **Add Sentry** - Crash reporting (2 hours)

---

## Performance Metrics to Track

### Before Optimization
- [ ] Measure current bundle size
- [ ] Measure app startup time
- [ ] Measure time to interactive
- [ ] Measure memory usage
- [ ] Measure network requests per session

### After Optimization
- [ ] Compare bundle size reduction
- [ ] Compare startup time improvement
- [ ] Compare memory usage reduction
- [ ] Compare network efficiency

---

## Notes

- All optimizations should be tested on both iOS and Android
- Monitor app performance after each optimization
- Use feature flags for risky optimizations
- Document any breaking changes
- Update this backlog as optimizations are completed

---

## Related Documentation

- `IMPLEMENTATION_GUIDE.md` - Complete implementation details
- `README.md` - Project overview
- `README_AUTH.md` - Authentication setup

---

**Last Updated:** 2024  
**Next Review:** After V1.0 launch
