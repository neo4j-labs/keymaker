export const doListsMatch = (list1, list2, threshold) => {
  const set1 = new Set(list1);
  const set2 = new Set(list2);
  const overlap = new Set([...set1].filter((x) => set2.has(x)));
  const universe = new Set([...set1, ...set2]);
  if (overlap.size / universe.size > threshold) {
    return true;
  }
  return false;
};
