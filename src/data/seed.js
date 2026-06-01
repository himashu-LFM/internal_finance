export const DEFAULT_SETTINGS = {
  orgName: 'Internal Team Budget Pool',
  currencySymbol: '₹',
  defaultTargetAmount: 0,
  openingBalance: 0,
}

/** Fresh install: empty pool — add your own members and transactions. */
export function getSeedState() {
  return {
    members: [],
    contributions: [],
    receivables: [],
    payables: [],
    settings: { ...DEFAULT_SETTINGS },
    lastSaved: new Date().toISOString(),
  }
}
