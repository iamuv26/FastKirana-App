try {
  const FileSystem = require('expo-file-system/legacy');
  console.log('FileSystem legacy imports succeeded!');
  console.log('documentDirectory:', FileSystem.documentDirectory);
  console.log('Keys:', Object.keys(FileSystem));
} catch (e) {
  console.error('FileSystem legacy imports failed:', e);
}
