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

  // Get full accessibility tree to see all fields
  const fullContent = await ui.snapshot({ full: true });

  // Search for the special research section and permission field
  const hasSection = fullContent.includes('Протокол спеціальних досліджень');
  const hasPermissionLabel = fullContent.includes('Реквізити Дозволу');
  const hasPermissionDefault = fullContent.includes(
    'Дозвіл на проведення робіт з ТЗІ',
  );

  // Extract the special research section content
  const specialResearchIndex = fullContent.indexOf(
    'Протокол спеціальних досліджень',
  );
  const relevantContent =
    specialResearchIndex > -1
      ? fullContent.substring(specialResearchIndex, specialResearchIndex + 1500)
      : 'Section not found';

  return {
    formLoaded: true,
    hasSpecialResearchSection: hasSection,
    hasPermissionField: hasPermissionLabel,
    hasDefaultPermission: hasPermissionDefault,
    specialResearchContent: relevantContent,
  };
}
