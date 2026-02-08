export const calculateBillSplit = (items, friends) => {
  const vegItems = items.filter(i => i.category === "Veg");
  const nonVegItems = items.filter(i => i.category === "Non-Veg");

  const totalVeg = vegItems.reduce((sum, i) => sum + i.price, 0);
  const totalNonVeg = nonVegItems.reduce((sum, i) => sum + i.price, 0);

  const vegFriends = friends.filter(f => f.type === "Veg");
  const nonVegFriends = friends.filter(f => f.type === "Non-Veg");

  const vegSharePerPerson = vegFriends.length ? totalVeg / vegFriends.length : 0;
  const nonVegSharePerPerson = nonVegFriends.length
    ? (totalVeg + totalNonVeg) / nonVegFriends.length
    : 0;

  const details = friends.map(f => {
    if (f.type === "Veg") {
      return { name: f.name, type: f.type, amountOwed: Math.round(vegSharePerPerson) };
    } else {
      return { name: f.name, type: f.type, amountOwed: Math.round(nonVegSharePerPerson) };
    }
  });

  return {
    totalVeg,
    totalNonVeg,
    vegShare: Math.round(vegSharePerPerson),
    nonVegShare: Math.round(nonVegSharePerPerson),
    details
  };
};
