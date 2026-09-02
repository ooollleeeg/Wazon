export default async function run(page, ui) {
  // Get console messages and network errors
  const consoleLogs = [];
  const networkErrors = [];

  // Capture console messages
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    });
  });

  // Capture failed requests
  page.on('response', (response) => {
    if (!response.ok() && response.status() !== 304) {
      networkErrors.push({
        status: response.status(),
        url: response.url(),
        statusText: response.statusText(),
      });
    }
  });

  // Wait a bit for initial page load
  await page.waitForTimeout(2000);

  // Get snapshot to see what's on page
  const snapshot = await ui.snapshot();

  return {
    consoleLogs: consoleLogs.filter(
      (l) => l.type === 'error' || l.type === 'warning',
    ),
    networkErrors,
    pageLoaded: snapshot.length > 0,
    snapshotPreview: snapshot.substring(0, 500),
  };
}
