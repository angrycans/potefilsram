/**
 * Name generator for Perilous-style fantasy maps.
 * Borrows grammar patterns from PerilousJS/Assets/grammar.json
 */

const COMP_PART1 = [
  "amber", "azure", "black", "bright", "cloud", "cold",
  "dagger", "dark", "dawn", "deep", "dusk", "ember", "ever",
  "free", "frost", "gold", "green", "high", "iron", "light", "low",
  "mirk", "pale", "red", "shadow", "silver", "sky", "star", "stone", "storm",
  "summer", "sun", "thunder", "timber", "under", "way", "west", "white",
  "winter", "wyrm", "blood", "brave", "rage", "river",
];

const COMP_PART2 = [
  "bloom", "breeze", "brook", "core", "crest", "cross", "fall",
  "fell", "fire", "heart", "hill", "moon",
  "myst", "pine", "point", "scale", "talon", "wind", "wing",
  "court", "field", "forge", "hall", "haven", "mill", "shield",
];

const ADJECTIVES = [
  "copper", "crimson", "dark", "dragon", "eastern", "emerald",
  "far", "new", "northern", "raven", "southern", "twilight", "western",
  "sandy", "deep", "high", "eagle", "snow", "bright", "broad", "clear",
];

const NOUNS = [
  "chapel", "corner", "farm", "gate", "hill", "mill", "point",
  "rest", "road", "watch", "well", "landing", "beach", "coast",
  "cove", "crossing", "bridge", "falls", "pass", "mine", "view", "glade",
];

const TOWN_SUFFIXES = ["ton", "ham", "wick", "ford", "bridge", "port", "pool", "field", "wood", "moor"];

const MOUNTAIN_NAMES = ["peak", "summit", "mount", "pinnacle", "ridge", "heights", "highland"];
const FOREST_NAMES = ["wood", "grove", "forest", "woodland", "weald", "thicket"];
const REGION_SUFFIXES = ["ia", "land", "shire"];

const EPIC_NOUNS = [
  "the ancients", "darkness", "illusions", "mysteries", "night",
  "sorrows", "stars", "storms", "wisdom", "dread", "light", "tides",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export class PerilousNameGenerator {
  /** Generate a compound name like "Stormcrest" or "Darkpine" */
  compound(): string {
    return capitalize(pick(COMP_PART1)) + pick(COMP_PART2);
  }

  /** Generate a town name like "Ironford" or "Duskham" */
  town(): string {
    if (Math.random() < 0.4) {
      return capitalize(pick(ADJECTIVES)) + " " + capitalize(pick(NOUNS));
    }
    return capitalize(pick(COMP_PART1)) + pick(TOWN_SUFFIXES);
  }

  /** Generate a region name like "Stormia" */
  region(): string {
    return this.compound().replace(/[aeiou]$/, "") + pick(REGION_SUFFIXES);
  }

  /** Generate a mountain range name */
  mountainRange(): string {
    if (Math.random() < 0.5) {
      return capitalize(pick(ADJECTIVES)) + " " + capitalize(pick(MOUNTAIN_NAMES));
    }
    return this.compound() + " " + capitalize(pick(MOUNTAIN_NAMES));
  }

  /** Generate a forest name */
  forest(): string {
    if (Math.random() < 0.5) {
      return capitalize(pick(ADJECTIVES)) + " " + capitalize(pick(FOREST_NAMES));
    }
    return this.compound() + " " + capitalize(pick(FOREST_NAMES));
  }

  /** Generate an island name */
  island(): string {
    const r = Math.random();
    if (r < 0.3) return capitalize(pick(ADJECTIVES)) + " Isle";
    if (r < 0.6) return "Isle of " + capitalize(pick(EPIC_NOUNS));
    return this.region();
  }

  /** Generate a river name */
  river(): string {
    if (Math.random() < 0.5) {
      return capitalize(pick(ADJECTIVES)) + " River";
    }
    return this.compound() + " River";
  }
}
