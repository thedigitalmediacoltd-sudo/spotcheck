#!/usr/bin/env node

/**
 * Automated Versioning Script for SpotCheck
 * 
 * This script:
 * 1. Reads the VERSION file (source of truth for marketing version)
 * 2. Reads app.json
 * 3. Increments build numbers (iOS buildNumber, Android versionCode)
 * 4. Updates expo.version to match VERSION file
 * 5. Writes changes back to app.json
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const VERSION_FILE = path.join(ROOT_DIR, 'VERSION');
const APP_JSON_FILE = path.join(ROOT_DIR, 'app.json');

// Read VERSION file
function readVersion() {
  try {
    const version = fs.readFileSync(VERSION_FILE, 'utf8').trim();
    if (!version) {
      throw new Error('VERSION file is empty');
    }
    return version;
  } catch (error) {
    console.error('❌ Error reading VERSION file:', error.message);
    process.exit(1);
  }
}

// Read app.json
function readAppJson() {
  try {
    const content = fs.readFileSync(APP_JSON_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Error reading app.json:', error.message);
    process.exit(1);
  }
}

// Write app.json
function writeAppJson(appJson) {
  try {
    const content = JSON.stringify(appJson, null, 2) + '\n';
    fs.writeFileSync(APP_JSON_FILE, content, 'utf8');
  } catch (error) {
    console.error('❌ Error writing app.json:', error.message);
    process.exit(1);
  }
}

// Increment build number (iOS)
function incrementBuildNumber(currentBuildNumber) {
  if (!currentBuildNumber) {
    return '1';
  }
  // Handle both string and number formats
  const num = typeof currentBuildNumber === 'string' 
    ? parseInt(currentBuildNumber, 10) 
    : currentBuildNumber;
  return String(num + 1);
}

// Increment version code (Android)
function incrementVersionCode(currentVersionCode) {
  if (currentVersionCode === undefined || currentVersionCode === null) {
    return 1;
  }
  return typeof currentVersionCode === 'number' 
    ? currentVersionCode + 1 
    : parseInt(currentVersionCode, 10) + 1;
}

// Main function
function main() {
  console.log('🔄 Bumping version...\n');

  // Read source of truth
  const version = readVersion();
  console.log(`📄 VERSION file: ${version}`);

  // Read app.json
  const appJson = readAppJson();

  // Ensure iOS section exists
  if (!appJson.expo.ios) {
    appJson.expo.ios = {};
  }

  // Ensure Android section exists
  if (!appJson.expo.android) {
    appJson.expo.android = {};
  }

  // Get current build numbers
  const currentIosBuild = appJson.expo.ios.buildNumber;
  const currentAndroidVersionCode = appJson.expo.android.versionCode;

  // Increment build numbers
  const newIosBuild = incrementBuildNumber(currentIosBuild);
  const newAndroidVersionCode = incrementVersionCode(currentAndroidVersionCode);

  // Update app.json
  appJson.expo.version = version;
  appJson.expo.ios.buildNumber = newIosBuild;
  appJson.expo.android.versionCode = newAndroidVersionCode;

  // Write back to app.json
  writeAppJson(appJson);

  // Log success
  console.log('\n✅ Version bump complete!');
  console.log(`🚀 Updated app.json:`);
  console.log(`   Version: ${version}`);
  console.log(`   iOS Build Number: ${newIosBuild}`);
  console.log(`   Android Version Code: ${newAndroidVersionCode}`);
  console.log('');
}

// Run the script
main();
