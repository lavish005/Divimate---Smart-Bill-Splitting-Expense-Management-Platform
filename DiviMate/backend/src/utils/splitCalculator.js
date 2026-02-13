export const calculateBillSplit = (items, friends) => {
  const vegItems = items.filter(i => i.category === "Veg");
  const nonVegItems = items.filter(i => i.category === "Non-Veg");

  const totalVeg = vegItems.reduce((sum, i) => sum + i.price, 0);
  const totalNonVeg = nonVegItems.reduce((sum, i) => sum + i.price, 0);

  const allCount = friends.length;
  const nonVegFriends = friends.filter(f => f.type === "Non-Veg");
  const nonVegCount = nonVegFriends.length;

  // Veg items are shared by EVERYONE
  const vegPerPerson = allCount > 0 ? totalVeg / allCount : 0;

  // Non-veg items shared only by non-veg people; if none exist, split among all
  const nonVegPerPerson = nonVegCount > 0
    ? totalNonVeg / nonVegCount
    : (allCount > 0 ? totalNonVeg / allCount : 0);

  // Veg person pays only vegPerPerson
  // Non-veg person pays vegPerPerson + nonVegPerPerson
  const vegSharePerPerson = Math.round(vegPerPerson);
  const nonVegSharePerPerson = Math.round(vegPerPerson + nonVegPerPerson);

  const details = friends.map(f => {
    if (f.type === "Veg") {
      return { name: f.name, type: f.type, amountOwed: vegSharePerPerson };
    } else {
      return { name: f.name, type: f.type, amountOwed: nonVegSharePerPerson };
    }
  });

  return {
    totalVeg,
    totalNonVeg,
    vegShare: vegSharePerPerson,
    nonVegShare: nonVegSharePerPerson,
    details
  };
};
