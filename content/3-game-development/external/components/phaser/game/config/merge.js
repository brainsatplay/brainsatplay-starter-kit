const merge = (base, newObj) => {
  const copy = Object.assign({}, base);

  if (newObj) {
    const copyKeys = Object.keys(copy);
    const newKeys = Object.keys(newObj);

    // Copy Matching Base Keys
    copyKeys.forEach((k) => {
      if (typeof newObj[k] === "object") merge(base[k], newObj[k]);
      else if (newObj[k]) base[k] = newObj[k];
    });

    // Copy New Keys
    newKeys.forEach((k) => (copy[k] = newObj[k]));
  }
  return copy;
};

export default merge;
