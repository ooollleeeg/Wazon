export default async function run(page, ui) {
  // Navigate to Class AS tab
  let snapshot = await ui.snapshot();
  let match = snapshot.match(/@(e\d+) button "АС класу 1,2,3"/);
  if (!match) return { error: 'AS button not found' };

  await ui.click(match[1]);
  await page.waitForTimeout(1000);

  // Click Add button
  snapshot = await ui.snapshot();
  match = snapshot.match(/@(e\d+) button "\+ Додати автоматизовану систему"/);
  if (!match) return { error: 'Add button not found' };

  await ui.click(match[1]);
  await page.waitForTimeout(2000);

  // Scroll down to see Special Research section
  await page.evaluate(() => {
    const formContent = document.querySelector('main');
    if (formContent) {
      formContent.scrollTop = formContent.scrollHeight;
    }
  });

  await page.waitForTimeout(1000);

  // Get snapshot to find the Special Research add button
  snapshot = await ui.snapshot();

  // Find "Протокол спеціальних досліджень" add button
  // We need to get all buttons and find the one after this heading
  const allText = snapshot;

  // Look for any add button (we need to find one that's in the special research section)
  // Let's get the full snapshot first to see structure
  const fullSnapshot = await ui.snapshot({ full: true });

  // Extract section around special research
  const sectionStart = fullSnapshot.indexOf('Протокол спеціальних досліджень');
  const sectionContent = fullSnapshot.substring(
    sectionStart,
    sectionStart + 500,
  );

  return {
    sectionFound: sectionStart > -1,
    sectionPreview: sectionContent,
    allRefs: snapshot.match(/@e\d+/g) || [],
  };
}
