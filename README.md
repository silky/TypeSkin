# TypeSkin

Tired of spending hours debugging ducky JavaScript code only to realize you forgot to convert an API input to a Number? Tired of having your whole app crash because of an out-of-bounds access? Can't use a safer language such as TypeScript or PureScript because of reasons? TypeSkin is a lightweight, drop-in layer on top of JavaScript which gives it an expressive static and dynamic type system with Haskell-inspired invariants.

## Static type checks

The basic idea is that, when declaring a top-level JavaScript values and functions, instead of doing it as usual:

```javascript
const inc = function(a) {
  return "1" + x;
}
```

You can, optionally, wrap it with a type annotation:

```javascript
const inc = T(
  T.Fn(T.Number, T.Number),
  function(x) {
    return "1" + x;
  }
);
```

And then run (i.e., "compile") your module with `node myLib.js`. TypeSkin will statically check your declarations and, if it detects a type error, display it:

![type mismatch](images/error0.png?raw=true)

That makes sense: `"1" + x` produces a `String`, not a `Number`, as annotated. If everything checks, your program behaves the exact same as if TypeSkin wasn't there at all - except it will also type-check arguments during runtime. That is very useful when you want to export checks to users of your lib, but has a runtime cost. Alternativelly, you can use TypeSkin only internally, having all the benefits of type checking with zero runtime overhead.

## Rich type language

Checking Numbers is trivial. TypeSkin allows you to define much richer types, using a very expressive dialect. Here is, for example, a type for Pokémon:

```javascript
const T = require("TypeSkin");

// A Pokémon Type
const Type = T.Enum(
  "normal" , "fight"   , "flying" , "poison"   ,
  "ground" , "rock"    , "bug"    , "ghost"    ,
  "steel"  , "fire"    , "water"  , "grass"    ,
  "dragon" , "psychic" , "ice"    , "electric" ,
  "dark"   , "fairy"
).__name("Type");

// A Pokémon Stat
const Stat = T.Enum(
  "hp"  , "atk" , "def",
  "spe" , "spa" , "spd"
).__name("Stat");

// A Pokémon
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

// A function that receives a Pokémon and returns an Uint8
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
```

Notice the presence of enums, several integer types, pairs, structs, a fixed-size vector and even Haskell's `Maybe`. Types are plentiful and everything is checked statically. Try, for example, changing `highestStat` to return `poke.name` instead: TypeSkin will present you a descriptive error pointing your mistake.

## Invariants (random automated tests)

Checking types is too mainstream. TypeSkin starts shining when you use invariants. Suppose we add this line to the code above:

```javascript
T.forall([Pokemon, Stat], (poke, stat) => highestStat(poke) >= poke.stats[stat]);
```

It says that, for every possible Pokémon, and for each of its Stat, we expect that the `highestStat` of that Pokémon is at least as big as that stat - which is obvious, isn't it? But when we try to "compile" that file again, we'll see an error:

![invariant violation](images/error1.png?raw=true)

Woops! It is telling us that our invariant doesn't hold for the `hp` stat of `wipumime`, a Pokémon randomly generated from the type, which happens to have its `hp` as the highest stat. **Seems like we forgot to add `poke.stats.hp` to our `highestStat` function!** Invariants are very similar to tests, in the sense they allow us to go beyound type-checking and detect mistakes based on actual expectations. You can, in a few lines of core, express invariants so rich that it is basically impossible for a function to pass without actually being correct.

## Learning

The best way to learn TypeSkin is by following the [TypeSkin game](game.js).

## Alternatives

TypeSkin shares many common usages as compile-to-javascript solutions such as TypeScript and PureScript. The main differences are: 

1. TypeSkin is really just JavaScript; you can check one or two expressions on the middle of your code and nothing else changes. No other language, no extra build steps, no performance penalty. Just JavaScript.

2. TypeSkin allows you to express much stronger stronger types than TypeScript, and even PureScript. Things such as `the function that receives a function of pairs of exactly two arrays of...` can be easily expressed and checked.

3. TypeSkin optionally gives you runtime checks (by exporting checked functions). This allows your library users to see informative error messages if they call your functions wrong, for free! This is not true for most compile-to-JavaScript languages.

All that comes at a harsh cost, though: **TypeSkin is not a real type system**. All its checking is based on repeatedly calling functions with random examples. As such, it can miss branches and be very, very wrong sometimes. Passing a TypeSkin test isn't a guarantee of correctness at all. For most real-world scenarios, though, it does a very good job at spotting the same mistakes an actual type systems would, with minimal programming effort. If you care about having real guarantees, under a light-years more expressive and robust system, I suggest using and collaborating to the [Idris]() project. Sadly, its JavaScript compiler is still too slow for practical purposes.

