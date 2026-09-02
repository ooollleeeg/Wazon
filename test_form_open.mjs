export default async function run(page, ui) {
  // Click "Додати автоматизовану систему" button
  let snapshot = await ui.snapshot();
  const addButton = snapshot.match(
    /@(e\d+) button "\+ Додати автоматизовану систему"/,
  )?.[1];

  if (!addButton) {
    return { error: 'Add button not found in snapshot' };
  }

  await ui.click(addButton);
  await page.waitForTimeout(1500);

  // Get full accessibility tree to see all sections
  snapshot = await ui.snapshot({ full: true });

  // Look for special research section
  const hasSpecialResearch = snapshot.includes(
    'Протокол спеціальних досліджень',
  );
  const hasPermissionField = snapshot.includes('Реквізити Дозволу');
  const hasDefaultPermission = snapshot.includes(
    'Дозвіл на проведення робіт з ТЗІ для власних потреб',
  );

  return {
    formOpened: true,
    hasSpecialResearchSection: hasSpecialResearch,
    hasPermissionField: hasPermissionField,
    hasDefaultPermission: hasDefaultPermission,
    fullSnapshot: snapshot,
  };
}
