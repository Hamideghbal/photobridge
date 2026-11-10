// Independent PhotoBridge CRM SMS segment estimates.
// GSM-7 default/extension tables; provider-specific billing must be confirmed
// by the server before any real SMS campaign is charged or sent.
const GSM_BASIC = new Set([...('@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'), '\n', '\r']);
const GSM_EXTENSION = new Set(['^', '{', '}', '\\', '[', ']', '~', '|', '€', '\f']);

export function countSmsSegments(value) {
  const text = String(value ?? '');
  let gsmSeptets = 0;
  let gsmCompatible = true;
  for (const character of text) {
    if (GSM_BASIC.has(character)) gsmSeptets += 1;
    else if (GSM_EXTENSION.has(character)) gsmSeptets += 2;
    else { gsmCompatible = false; break; }
  }
  const encoding = gsmCompatible ? 'GSM-7' : 'UCS-2';
  // JavaScript's UTF-16 length counts astral symbols as two UCS-2 units.
  const units = gsmCompatible ? gsmSeptets : text.length;
  const singleLimit = gsmCompatible ? 160 : 70;
  const multipartLimit = gsmCompatible ? 153 : 67;
  const segments = units === 0 ? 0 :
    units <= singleLimit ? 1 : Math.ceil(units / multipartLimit);
  const totalCapacity = segments === 0 ? singleLimit :
    segments === 1 ? singleLimit : multipartLimit * segments;
  return {
    encoding, units, segments,
    singleLimit, multipartLimit,
    remainingUnits: totalCapacity - units,
  };
}

function priceInRials(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

// Accepts personalized previews (each with {text, valid}); price is optional.
// An accurate production campaign must also filter permission, duplicates,
// gateway policy/line type, and provider rates before final confirmation.
export function estimateSmsBatch(previews, pricePerSegmentRials = null) {
  if (!Array.isArray(previews)) throw new TypeError('previews must be an array');
  const details = previews.map(preview => ({
    customerId: preview.customerId,
    valid: preview.valid === true,
    ...countSmsSegments(preview.text),
  }));
  const validDetails = details.filter(item => item.valid);
  const segments = validDetails.reduce((sum, item) => sum + item.segments, 0);
  const unitPrice = priceInRials(pricePerSegmentRials);
  const candidateCost = unitPrice === null ? null : unitPrice * segments;
  return {
    recipients: previews.length,
    validRecipients: validDetails.length,
    invalidRecipients: previews.length - validDetails.length,
    totalSegments: segments,
    unitPriceRials: unitPrice,
    estimatedCostRials: Number.isSafeInteger(candidateCost) ? candidateCost : null,
    details,
  };
}
