export default async function run(page, ui) {
  // Navigate to Class AS tab
  let snapshot = await ui.snapshot();
  const classASButton = snapshot.match(/@(e\d+) button "АС класу 1,2,3"/)?.[1];

  if (!classASButton) {
    return {
      error: 'AS button not found',
      snapshot: snapshot.substring(0, 300),
    };
  }

  await ui.click(classASButton);
  await page.waitForTimeout(1000);

  // Take new snapshot to see the tab
  snapshot = await ui.snapshot();

  // Look for special research section
  const hasSpecialResearch = snapshot.includes(
    'Протокол спеціальних досліджень',
  );
  const hasAddButton = snapshot.includes('Додати запис');

  return {
    classASLoaded: true,
    hasSpecialResearchSection: hasSpecialResearch,
    hasAddButton: hasAddButton,
    snapshot: snapshot.substring(0, 800),
  };
}
