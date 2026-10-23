async function checkL07Details() {
  const enRes = await fetch('https://backrooms-wiki.wikidot.com/normal-levels-i');
  const enHtml = await enRes.text();
  const m = enHtml.match(/<a href="([^"]*level-0-7[^"]*)">([^<]+)<\/a>\s*(?:-|–|—)?\s*([^\n\r<]*)/i);
  console.log('Match for 0.7 in normal-levels-i:', m ? { path: m[1], title: m[2], sub: m[3] } : 'NOT FOUND');

  if (m) {
    console.log('Fetching', m[1], 'on EN:');
    const r = await fetch('https://backrooms-wiki.wikidot.com' + m[1]);
    console.log('Status on EN:', r.status);
    const html = await r.text();
    console.log('Title on EN:', html.match(/<title>(.*?)<\/title>/i)?.[1]);
  }
}
checkL07Details();
