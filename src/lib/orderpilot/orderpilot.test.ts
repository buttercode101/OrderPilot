import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteTotal, lineTotal, whatsappLink } from './money';
import { enquiryFromMessage, patchEnquiry, applyReading, quoteText, mergeReply, confirmQuoteLine, confirmProgress, isReadyToSend, recordSendOverride, previewConfidence, looksLikeVoiceNote, COMPOSER_MAX_CHARS, COMPOSER_MIN_CHARS } from './engine';
import { buildDemo, buildStarterForTrade, STARTER_LISTS } from './presets';
import { TRADES } from './types';
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

test('per-line confirm flips one flag only; ready is derived (bulk-confirm gone)', () => {
  const d = buildDemo();
  const base = enquiryFromMessage('Buffet for 80 people next Saturday, please include delivery and a celebration cake', d.business, d.prices, "paste");
  const e = { ...base, lines: base.lines.map((l, i) => (i < 2 ? { ...l, assumed: true } : l)) };
  assert.ok(e.lines.length >= 2, 'expected at least 2 suggested lines');
  const assumed = e.lines.filter(l => l.assumed);
  assert.ok(assumed.length >= 1);
  const next = confirmQuoteLine(e.lines, assumed[0].id);
  assert.equal(next.filter(l => l.assumed).length, assumed.length - 1);
  assert.deepEqual(confirmProgress(next), { confirmed: next.length - (assumed.length - 1), total: next.length, unconfirmed: assumed.length - 1 });
  // forcedReady no longer forces ready
  const forced = patchEnquiry(e, { forcedReady: true, status: 'ready' } as never, d.prices, d.business.trade);
  assert.equal(forced.forcedReady, false);
  if (!isReadyToSend(e, d.business.trade)) assert.equal(forced.status, 'needs-info');
});

test('send-anyway override records unconfirmed lines and blocking gaps', () => {
  const d = buildDemo();
  const e = enquiryFromMessage('Buffet for 80 people', d.business, d.prices, "paste");
  const next = recordSendOverride(e, d.business.trade);
  assert.equal(next.status, 'sent');
  assert.ok(next.sendOverride);
  assert.ok(Array.isArray(next.sendOverride.lines) && Array.isArray(next.sendOverride.blockedBy));
});

test('every trade incl other yields non-empty starter book; sample/empty modes work', () => {
  for (const trade of TRADES) {
    const empty = buildStarterForTrade(trade, 'empty');
    assert.ok(empty.prices.length > 0, trade);
    assert.equal(empty.business.trade, trade);
    assert.deepEqual(empty.enquiries, []);
    const sample = buildStarterForTrade(trade, 'sample');
    assert.ok(sample.enquiries.length >= 1, trade);
    assert.ok(sample.enquiries.every(en => en.lines !== undefined));
  }
  assert.equal(STARTER_LISTS.length, 6);
  assert.equal(buildStarterForTrade('cleaning', 'demo').business.trade, 'catering');
});

test('composer limits and preview confidence: 8-char rule, 6000 cap, amber guessed, voice-note', () => {
  assert.equal(COMPOSER_MIN_CHARS, 8);
  assert.equal(COMPOSER_MAX_CHARS, 6000);
  assert.equal(previewConfidence('We are near Claremont', 'location', 'Claremont'), 'high');
  assert.equal(previewConfidence('We are in a quiet suburb', 'location', 'A Quiet Suburb'), 'guessed');
  assert.equal(previewConfidence('about 80 people', 'quantity', '80 people'), 'guessed');
  assert.equal(previewConfidence('80 people', 'quantity', '80 people'), 'high');
  assert.equal(previewConfidence('hi', 'location', ''), 'missing');
  assert.equal(looksLikeVoiceNote('hi can you clean my house next week in rondebosch please'), true);
  assert.equal(looksLikeVoiceNote('Hi, can you clean?'), false);
});
