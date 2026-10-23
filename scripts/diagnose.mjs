async function diagnose() {
  console.log('=== CHECKING LEVEL 0.2 ===');
  const l02Res = await fetch('https://es-backrooms-wiki.wikidot.com/level-0-2');
  console.log('ES Level 0.2 status:', l02Res.status);
  const l02Html = await l02Res.text();
  const start02 = l02Html.indexOf('id="page-content"');
  console.log('ES Level 0.2 snippet:\n', l02Html.substring(start02, start02 + 800));

  console.log('\n=== CHECKING LEVEL 0.7 ===');
  const l07Es = await fetch('https://es-backrooms-wiki.wikidot.com/level-0-7');
  console.log('ES Level 0.7 status:', l07Es.status);
  const l07En = await fetch('https://backrooms-wiki.wikidot.com/level-0-7');
  console.log('EN Level 0.7 status:', l07En.status);

  // If 404 in ES, check why it is 404 or what slug it has on Wikidot ES
  if (!l07Es.ok) {
    const searchRes = await fetch('https://es-backrooms-wiki.wikidot.com/normal-levels-i');
    const searchHtml = await searchRes.text();
    const match07 = searchHtml.match(/<a href="([^"]*level-0-7[^"]*)">/i);
    console.log('Does level-0.7 link exist in ES normal-levels-i?', match07 ? match07[1] : 'NO');
  }

  console.log('\n=== CHECKING LEVEL 0.1 ===');
  const l01Es = await fetch('https://es-backrooms-wiki.wikidot.com/level-0-1');
  console.log('ES Level 0.1 status:', l01Es.status);
  const l01Html = await l01Es.text();
  const start01 = l01Html.indexOf('id="page-content"');
  console.log('ES Level 0.1 snippet:\n', l01Html.substring(start01, start01 + 1200));

  console.log('\n=== CHECKING EN LEVEL 0.1 ===');
  const l01En = await fetch('https://backrooms-wiki.wikidot.com/level-0-1');
  const l01EnHtml = await l01En.text();
  const start01En = l01EnHtml.indexOf('id="page-content"');
  console.log('EN Level 0.1 snippet:\n', l01EnHtml.substring(start01En, start01En + 1200));
}
diagnose();
