// Calendrier saisonnier des fruits & légumes en France

interface Month {
  fruits: string[];
  veggies: string[];
}

// 1 = janvier ... 12 = décembre
export const SEASONAL_FR: Record<number, Month> = {
  1: {
    fruits: ["pomme", "poire", "kiwi", "orange", "mandarine", "clémentine", "citron", "pamplemousse"],
    veggies: ["carotte", "poireau", "chou", "endive", "épinard", "topinambour", "courge", "panais", "betterave"],
  },
  2: {
    fruits: ["pomme", "poire", "kiwi", "orange", "citron", "pamplemousse"],
    veggies: ["carotte", "poireau", "chou", "endive", "épinard", "topinambour", "courge", "betterave"],
  },
  3: {
    fruits: ["pomme", "kiwi", "orange", "citron"],
    veggies: ["carotte", "poireau", "endive", "épinard", "radis", "betterave", "asperge"],
  },
  4: {
    fruits: ["pomme", "kiwi", "fraise"],
    veggies: ["asperge", "carotte", "épinard", "radis", "petits pois", "navet"],
  },
  5: {
    fruits: ["fraise", "rhubarbe", "cerise"],
    veggies: ["asperge", "artichaut", "petits pois", "fève", "radis", "carotte", "concombre"],
  },
  6: {
    fruits: ["fraise", "cerise", "abricot", "framboise", "groseille", "melon"],
    veggies: ["courgette", "tomate", "concombre", "haricot vert", "aubergine", "poivron", "artichaut"],
  },
  7: {
    fruits: ["abricot", "pêche", "nectarine", "melon", "pastèque", "myrtille", "framboise", "fraise"],
    veggies: ["tomate", "courgette", "aubergine", "poivron", "haricot vert", "maïs", "concombre"],
  },
  8: {
    fruits: ["pêche", "nectarine", "melon", "pastèque", "prune", "mirabelle", "figue", "raisin"],
    veggies: ["tomate", "courgette", "aubergine", "poivron", "maïs", "haricot vert", "fenouil"],
  },
  9: {
    fruits: ["raisin", "figue", "mirabelle", "prune", "poire", "pomme", "pêche"],
    veggies: ["tomate", "courgette", "aubergine", "poivron", "champignon", "courge", "blette", "épinard"],
  },
  10: {
    fruits: ["pomme", "poire", "raisin", "coing", "châtaigne", "figue", "kiwi"],
    veggies: ["potiron", "courge", "champignon", "épinard", "endive", "céleri", "betterave", "chou"],
  },
  11: {
    fruits: ["pomme", "poire", "kiwi", "coing", "châtaigne", "clémentine", "mandarine"],
    veggies: ["potiron", "courge", "endive", "chou", "poireau", "panais", "topinambour", "céleri"],
  },
  12: {
    fruits: ["pomme", "poire", "kiwi", "orange", "mandarine", "clémentine", "citron"],
    veggies: ["potiron", "courge", "endive", "chou", "poireau", "panais", "topinambour"],
  },
};

export function getSeasonalIngredients(month?: number): string[] {
  const m = month ?? new Date().getMonth() + 1;
  const data = SEASONAL_FR[m];
  return [...data.fruits, ...data.veggies];
}

export function currentMonthLabel(): string {
  const m = new Date().getMonth();
  return ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"][m];
}
