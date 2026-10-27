import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteTotal, lineTotal, whatsappLink } from './money';
import { enquiryFromMessage, patchEnquiry, applyReading, quoteText, mergeReply } from './engine';
import { buildDemo } from './presets';
import { parseBackup } from './backup';

test('quote totals equal the sum of rounded line totals', () => {
  assert.equal(lineTotal(1, 1.005), 1.01);
  assert.equal(quoteTotal([{qty:1,unitPrice:1.005},{qty:1,unitPrice:1.005}]), 2.02);
  assert.equal(quoteTotal([{qty:3,unitPrice:0.1}]), 0.3);
});
test('WhatsApp uses only a phone number, supports SA and ignores emails', () => {
  assert.match(whatsappLink('082 123 4567 · a123@example.com', 'Hi'), /wa.me\/27821234567\?/);
  assert.match(whatsappLink('a123@example.com', 'Hi'), /wa.me\/\?/);
});
test('unmatched enquiries cannot invent quote lines', () => {
  const d = buildDemo(); const e = enquiryFromMessage('Please fix my spaceship tomorrow', d.business, [], "paste");
  assert.deepEqual(e.lines, []); assert.equal(e.status, 'needs-info');
});
test('price edits do not silently change existing quotes or their currency', () => {
  const d = buildDemo(); const e = enquiryFromMessage('Buffet catering for 80 people next Saturday in Sandton. No allergies.',d.business,d.prices,"paste");
  assert.ok(e.lines.length); const before = quoteTotal(e.lines);
  const changed = d.prices.map(p => ({...p,price:p.price+100}));
  const next = patchEnquiry(e,{customerName:'Rama'},changed,d.business.trade);
  assert.equal(quoteTotal(next.lines),before);
  assert.match(quoteText({...d.business,currency:'USD'},e), /Total: R/);
});
test('AI catalog identifiers cannot introduce arbitrary prices', () => {
  const d = buildDemo(); const e = enquiryFromMessage('Buffet for 80 people next Saturday',d.business,d.prices,"paste");
  const next = applyReading(e,{customerName:'',contact:'',service:'',quantity:80,quantityLabel:'people',when:'',location:'',notes:'',missingQuestions:[],lineItems:[{id:'fake',qty:99}],followUp:''},d.prices,d.business.trade);
  assert.deepEqual(next.lines,e.lines);
});
test('paid status survives detail edits', () => {
  const d=buildDemo(); const e={...d.enquiries[0],status:'paid' as const};
  assert.equal(patchEnquiry(e,{notes:'Paid by EFT'},d.prices,d.business.trade).status,'paid');
});
test('reply preserves manually chosen prices', () => {
  const d=buildDemo(); const e={...d.enquiries[0],linesCustom:true};
  const next=mergeReply(e,'We are in Sandton. No allergies.',d.prices,d.business.trade);
  assert.equal(next.location,'Sandton'); assert.deepEqual(next.lines,e.lines);
});
test('backup roundtrip and invalid input validation', () => {
  const d=buildDemo(); const raw={format:'orderpilot-backup',version:1,exportedAt:new Date().toISOString(),data:d};
  assert.deepEqual(parseBackup(JSON.stringify(raw)),d);
  assert.throws(()=>parseBackup('{"data":{}}'));
  raw.data.prices[0].price=-5; assert.throws(()=>parseBackup(JSON.stringify(raw)));
});
