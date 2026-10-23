import { WikidotService } from '../src/services/wikidotService.ts';

async function testL01() {
  const item = await WikidotService.fetchItemDetails('/level-0-1', 'level', 'es');
  console.log('Title:', item.title);
  console.log('Subtitle:', item.subTitle);
  console.log('Description:\n', item.description);
  console.log('Sections count:', item.sections.length);
  item.sections.forEach(s => console.log('Section title:', s.title, 'length:', s.content.length));
}
testL01();
