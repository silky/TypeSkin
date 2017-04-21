const T = require(".");
const ___ = null;

// Welcome to the TypeSkin game!
// 1. Clone this repository
// 2. Run it with `node game/game.js`
// 3. You'll see a type error
// 4. Fill the ___s until everything type-checks
// 5. ...?
// 6. Go write safer code



// Base types
const b0 = T(T.Number, ___);
const b1 = T(T.Boolean, ___);
const b2 = T(T.String, ___);




// Numeric types
const n0 = T(T.Uint8, ___);
const n1 = T(T.Int8, ___);
const n2 = T(T.Uint32, ___);
const n3 = T(T.Uint(2), ___);
const n4 = T(T.Between(1.3, 1.7), ___);
const n5 = T(T.IntBetween(16, 19), ___);




// String types
const s0 = T(T.Bytes, ___);
const s1 = T(T.Date, ___);




// Array types
const a0 = T(T.Array(T.String), ["Alice", "Bob", ___]);
const a1 = T(T.Array(T.Number), [1, 2, 3, ___]);
const a2 = T(T.Vector(4, T.Number), [1, 2, 3, ___]); // Arrays of exactly 4 elements




// Enums
const Weapon = T.Enum(
  "Sword", "Lance", "Axe",
  "Knife", "Staff", "Bow"
).__name("Weapon"); // you can name types for better errors

const w0 = T(Weapon, ___);
const w1 = T(Weapon, ___);
const w2 = T(Weapon, ___);




// Structs
const Player = T.Struct({
  atk: T.Number,
  def: T.Number,
  wpn: Weapon,
  bag: T.Array(T.String),
}).__name("Player");

const p0 = T(Player ,{
  atk: ___,
  def: 14,
  wpn: ___,
  bag: ["rope", ___]
});
  



// Functions
const add = T(
  T.Fn(T.Number, T.Number, T.Number),
  function(a, b) {
    return ___;
  });

const reverse = T(
  T.Fn(T.Array(T.Number), T.Array(T.Number)),
  function(array) {
    return ___;
  });

const concat = T(
  T.Fn(T.String, T.String, T.String),
  function(a, b) { 
    return ___;
  });




// Invariants
// a.k.a. did you cheat on the implementations above?

 // "addition associates"
T.forall([T.Number, T.Number],
  (a,b) => add(a,b) === add(b,a));

 // "last element is the first after reverse"
T.forall([T.Array(T.Number)],
  (a) => a.lenght === 0 || a[0] === reverse(a)[0]);

// "concatenation adds lengths"
T.forall([T.String, T.String],
  (a, b) => concat(a,b).length === a.length + b.length);

// "concatenation commutes"
T.forall([T.String, T.String, T.String],
  (a, b, c) => concat(concat(a,b),c) === concat(a,concat(b,c)));




// Custom types

const DigimonName = T(T.Type, {

  // a human-readable description on how to construct an element of that type
  form: "a plain JavaScript String ending with 'mon'",

  // tests whether `x` is an inhabitant of this type
  test: x => T.String.test(x) && x.slice(-3) === "mon",

  // produces a random inhabitant of this type (if s is true, return a readable value)
  rand: s => T.String.rand(s) + "mon"
}).__name("DigitmonName");

const digimonify = T(
  T.Fn(T.String, DigimonName),
  function(name) {
    return ___;
  });




// Polymorphism
// Possible, but checking can only happen when you instance solid values.

const map = (A, B) => T(
  T.Fn(T.Fn(A, B), T.Array(A), T.Array(B)), // ∀ a . ∀ b . (a -> b) -> [a] -> [b]
  function(f, array) {
    let result = [];
    for (let i = 0; i < array.length; ++i)
      result.push(___);
    return result;
  })

map(T.Number, T.String);
map(T.Number, T.Boolean);



// The Pokémon example

const Type = T.Enum(
  "normal" , "fight"   , "flying" , "poison"   ,
  "ground" , "rock"    , "bug"    , "ghost"    ,
  "steel"  , "fire"    , "water"  , "grass"    ,
  "dragon" , "psychic" , "ice"    , "electric" ,
  "dark"   , "fairy"
).__name("Type");

const Stat = T.Enum(
  "hp"  , "atk" , "def",
  "spe" , "spa" , "spd"
).__name("Stat");

const Pokemon = T.Struct({
  name: T.String,
  number: T.Uint16,
  types: T.Pair(Type, T.Maybe(Type)),
  attacks: T.Vector(4, T.String),
  stats: T.Struct({
    hp: T.Uint8,
    atk: T.Uint8,
    def: T.Uint8,
    spe: T.Uint8,
    spa: T.Uint8,
    spd: T.Uint8
  })
}).__name("Pokemon");

const highestStat = T(
  T.Fn(Pokemon, T.Uint8),
  function(poke) { 
    return Math.max(
      poke.stats.hp,
      poke.stats.atk,
      poke.stats.spe,
      poke.stats.spa,
      poke.stats.spd); 
  })




// OK that's it. A last challenge:

const sort = T(
  T.Fn(T.Array(T.Uint8), T.Array(T.Uint8)),
  function(nums) {
    return ___;
  }
);

// "sorting an array doesn't change its length"
T.forall([T.Array(T.Uint8)],
  (arr) => arr.length === sort(arr).length);

// "sorting an array doesn't change its elements"
T.forall([T.Array(T.Uint8), T.Uint8],
  (arr, i) => !arr[i] || sort(arr).indexOf(arr[i]) !== -1);

// "in a sorted array, arr[i] < arr[i + 1]"
T.forall([T.Array(T.Uint8), T.Uint8], (arr, uint) => {
  if (arr.length <= 1) return true;
  const i = uint % (arr.length - 1);
  const s = sort(arr);
  return s[i] <= s[i + 1];
});




//// You just used .sort(), didn't you?
//// OK, then, THIS is your last challenge.

// "a sorted array is not sorted"
T.forall([T.Array(T.Uint8)],
  (array) => JSON.stringify(sort(array)) !== JSON.stringify(array.sort()));

// (wutt)
// Create a function that satisfies my specification
// of `sort`, but isn't actually a sorting function.
// (I'm not sure if that is possible.)

console.log("If you're seeing this after only changing ___s, you've won the game! Sadly, you also lost The Game.");
