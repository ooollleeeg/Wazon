export default async function run(page, ui) {
  // First, navigate to Class AS tab
  let snapshot = await ui.snapshot();

  // Find and click the "АС класу 1,2,3" button
  const match = snapshot.match(/@(e\d+) button "АС класу 1,2,3"/);
  if (!match) {
    return { error: 'AS button not found', snapshot };
  }

  const classASBtn = match[1];
  console.log('Clicking AS button:', classASBtn);
  await ui.click(classASBtn);
  await page.waitForTimeout(1500);

  // Now look for the Add button
  snapshot = await ui.snapshot();
  const addMatch = snapshot.match(
    /@(e\d+) button "\+ Додати автоматизовану систему"/,
  );

  if (!addMatch) {
    return {
      error: 'Add button not found after clicking AS tab',
      snapshot: snapshot.substring(0, 1000),
    };
  }

  const addBtn = addMatch[1];
  console.log('Clicking Add button:', addBtn);
  await ui.click(addBtn);
  await page.waitForTimeout(2000);

  // Get full page to see form
  snapshot = await ui.snapshot({ full: true });

  const hasSpecialResearch = snapshot.includes(
    'Протокол спеціальних досліджень',
  );
  const hasPermissionField = snapshot.includes('Реквізити Дозволу');
  const hasDefaultValue = snapshot.includes('Дозвіл на проведення робіт');

  return {
    success: true,
    hasSpecialResearchSection: hasSpecialResearch,
    hasPermissionField: hasPermissionField,
    hasDefaultValue: hasDefaultValue,
    formContent: snapshot.substring(0, 2000),
  };
}
