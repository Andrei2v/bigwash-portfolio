const text = value => String(value ?? '').trim();

function hasClientIdentity(client) {
  return Boolean(client && [
    client.name ?? client.firstname, client.surname ?? client.lastname,
    client.phone, client.email, client.card
  ].some(value => text(value)));
}

export function validateClient(client, { creating = false, previous = null } = {}) {
  // The existing contract does not require a particular name/phone combination.
  if ((creating || hasClientIdentity(previous)) && !hasClientIdentity(client)) return 'clientIdentityRequired';
  const email = text(client.email);
  // Preserve legacy records with an unchanged email while validating newly entered values.
  if (email && (creating || email !== text(previous?.email)) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'clientEmailInvalid';
  }
  return '';
}

export const validCardDiscount = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
export const validWholeMoney = value => Number.isSafeInteger(value) && value >= 0;
