export const calculateWhoOwesWhom = (split, friends, paidBy) => {
  const totalBill = split.totalVeg + split.totalNonVeg;
  const totalPaid = Object.values(paidBy).reduce((a, b) => a + b, 0);

  const balances = {};
  friends.forEach((f) => (balances[f.name] = 0));

  split.details.forEach((f) => {
    balances[f.name] -= f.amountOwed;
  });

  Object.keys(paidBy).forEach((payer) => {
    balances[payer] += paidBy[payer];
  });

  const totalOwed = totalBill - totalPaid;

  let transactions = [];
  if (totalPaid >= totalBill) {
    const debtors = [];
    const creditors = [];

    for (const [name, balance] of Object.entries(balances)) {
      if (balance < 0) debtors.push({ name, balance });
      if (balance > 0) creditors.push({ name, balance });
    }

    debtors.sort((a, b) => a.balance - b.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    for (const debtor of debtors) {
      for (const creditor of creditors) {
        if (debtor.balance === 0) break;
        if (creditor.balance === 0) continue;

        const amount = Math.min(creditor.balance, -debtor.balance);
        transactions.push({
          from: debtor.name,
          to: creditor.name,
          amount,
        });

        debtor.balance += amount;
        creditor.balance -= amount;
      }
    }
  }

  return { balances, transactions, totalBill, totalPaid, totalOwed };
};
