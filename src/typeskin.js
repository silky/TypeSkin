const utils = require("./utils.js");

// Performs static type checking, enables dynamic type checks.
function T(type, term) {
  let original = term;
  if (term && !term.__meta) {
    term = type.wrap ? type.wrap(term) : term;
    term.__meta = {};
    term.__name = function(name) {
      term.__meta.name = name;
      return term;
    };
    term.__desc = function(desc) {
      term.__meta.desc = desc;
      return term;
    };
    if (term.__meta) {
      term.__meta.term = original;
      term.__meta.name = "anon";
      term.__meta.desc = "no description";
    };
  };
  T.check(type, term);
  return term;
}

// Checks a term
T.check = (type, value) => {
  const tested = type.test(value);
  let error = null;
  if (tested instanceof Array) {
    error = tested;
  } else if (tested === false) {
    error = utils.flatten([
      ["TypeSkin was expecting a value of type " + utils.color(34,type.__meta.name) + "."],
      ["Instead, it got:"],
      [" "],
      utils.indent(utils.showBlock(value)),
      [" "],
      utils.showBlock(type)]);
  }
  if (error) {
    throw new Error("\n" + utils.textBlock(60, 1, [
      utils.color(31, "TypeSkin type mismatch."),
      utils.replicate(58, "-").join("")
    ].concat(error)));
  }
}

// Ensures an invariant holds for several test cases.
T.forall = function(types, invariant, attempts) {
  for (let i = 0; i < (attempts || 4096); ++i) {
    let args = types.map(type => type.rand(true)); 
    if (!invariant.apply(this, args)) {
      throw new Error("\n" + utils.textBlock(60, 1, utils.flatten([
        [utils.color(31, "TypeSkin invariant violation.")],
        [utils.replicate(58, "-").join("")],
        [" ", "For every [" + types.map(type => type.__meta.name).join(", ") + "], the following invariant should hold:", " "],
        utils.showBlock(invariant),
        [" ", "But it didn't hold for the following values:", " "],
        utils.indent(utils.flatten(utils.flatten(args.map(arg => [utils.showBlock(arg), " "]))))
      ])));
    }
  }
  return true;
}

T.Type = {
  form: [
    "a tuple with the fields `test` (a Function which receives a value and ",
    "returns true iff that value is an inhabitant of the type), and `rand` ",
    "(a Function that returns a random inhabitant of the type)"].join(""),
  test: type => type instanceof Object
    && typeof type.form === "string"
    && type.test instanceof Function
    && type.rand instanceof Function,
  rand: () => null,
  __meta: {
    name: "Type",
    desc: "a type",
  }
}

T.Boolean = T(T.Type, {
  form: "a JavaScript Boolean",
  test: value => value === true || value === false,
  rand: () => Math.random() > 0.5
})
.__name("Boolean")
.__desc("a boolean");

T.Number = T(T.Type, {
  form: "a JavaScript Number",
  test: number => typeof number === "number" && !isNaN(number),
  rand: s => {
    const r = (Math.random() - 0.5) * Math.pow(2, Math.random() * 32 | 0);
    return s ? ((r % 1024) * 100 | 0) / 100 : r;
  }
})
.__name("Number")
.__desc("a double-precision floating-point real number");

T.Enum = (...vals) => T(T.Type, {
  form: "JavaScript String on the set [" + vals.map(JSON.stringify).join(", ") + "]",
  test: value => typeof value === "string" && vals.indexOf(value) !== -1,
  rand: () => vals[Math.random() * vals.length | 0]
})
.__name("Enum(" + vals.join(",") + ")")
.__desc("an enum of " + vals.length + " values (" + vals.join(", ") + ")");

T.Maybe = type => T(T.Type, {
  form: "either a " + type.form + " or null",
  test: value => value === null || type.test(value),
  rand: s => Math.random() < 0.2 ? null : type.rand(s)
})
.__name("Maybe(" + type.__meta.name + ")")
.__desc("maybe a " + type.__meta.name);

T.Either = (a, b) => T(T.Type, {
  form: "either a " + a.form + " or a " + b.form,
  test: value => a.test(value) || b.test(value),
  rand: s => Math.random() < 0.5 ? a.rand(s) : b.rand(s)
})
.__name("Either(" + a.__meta.name + "," + b.__meta.name + ")")
.__desc("either a " + a.__meta.name + " or a " + b.__meta.name);

T.Int = bits => T(T.Type, {
  form: "a non-decimal JavaScript Number with " + bits + " bits",
  test: value => T.Number.test(value)
    && Math.floor(value) === value
    && -Math.pow(2, bits) / 2 <= value
    && value < Math.pow(2, bits) / 2,
  rand: () => Math.floor((Math.random() - 0.5) * Math.pow(2, bits))
})
.__name("(Int " + bits + ")")
.__desc("a " + bits + "-bit integer number");

T.Uint = bits => T(T.Type, {
  form: "a non-decimal positive JavaScript Number with " + bits + " bits",
  test: value => T.Number.test(value)
    && Math.floor(value) === value
    && value < Math.pow(2, bits),
  rand: rand = () => Math.floor(Math.random() * Math.pow(2, bits))
})
.__name("(Uint " + bits + ")")
.__desc("a " + bits + "-bit non-negative integer number");

["Uint", "Int"].forEach(type => {
  [8, 16, 32].forEach(size => {
    T[type + size] = T(T.Type, {
      form: T[type](size).form,
      test: T[type](size).test,
      rand: T[type](size).rand
    })
    .__name(type + size)
    .__desc(T[type](size).__meta.desc);
  })
});

T.IntBetween = (from, to) => T(T.Type, {
  form: "a non-decimal JavaScript Number from " + from + " to " + to,
  test: value => T.Int(32).test(value) && from <= value && value <= to,
  rand: rand = () => from + ((to - from) * Math.random() | 0)
})
.__name("IntBetween(" + from + "," + to +")")
.__desc("an integer number from " + from + " to " + to);

T.Between = (from, to) => T(T.Type, {
  form: "a JavaScript Number from " + from + " to " + to,
  test: value => T.Number.test(value) && from <= value && value <= to,
  rand: rand = () => from + ((to - from) * Math.random())
})
.__name("IntBetween(" + from + "," + to +")")
.__desc("an integer number from " + from + " to " + to);

T.String = T(T.Type, {
  form: "a plain JavaScript String",
  test: value => typeof value === "string",
  rand: s => {
    const syllable = () =>
      utils.randomOf("cdfghjklmnpqrstvwxyz")
      + utils.randomOf("aeiou");
    if (s) {
      return utils
        .generate(Math.random() * 6 | 0, () =>
          utils.randomOf("cdfghjklmnpqrstvwxyz")
          + utils.randomOf("aeiou"))
        .join("");
    } else {
      return utils.generate(
        Math.random() * 64,
        () => String.fromCharCode(32 + (Math.random() * 94 | 0)))
        .join("");
    }
  }
})
.__name("String")
.__desc("an UTF-8 string");

T.Bytes = T(T.Type, {
  form: "a plain JavaScript String containing an even number of hex (`0123456789abcdef`) characters",
  test: bytes => typeof bytes === "string" && /^[0-9a-f]*$/.test(bytes),
  rand: s => {
    const digits = "0123456789abcdef";
    const length = (Math.random() * (s ? 4 : 512) | 0) * 2;
    const genChar = () => utils.randomOf(digits);
    return utils.generate(length, genChar).join("");
  }
})
.__name("Bytes")
.__desc("a byte-string");

T.Date = T(T.Type, {
  form: "a plain JavaScript String containing an ISO-8601 date",
  test: date => /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/.test(date),
  rand: () => new Date(new Date().getTime() * (0.5 + Math.random()))
})
.__name("Date")
.__desc("an UTF-8 date");

T.Struct = struct => {
  const fts = Object.keys(struct).map(field => [field, struct[field]]);
  return T(T.Type, {
    form: "a JavaScript Object with the fields " + fts.map(([field,type]) => "`" + field + "`" + " (" + type.form + ")").join(", "),
    test: obj => fts.reduce((r,[field,type]) => r && type.test(obj[field]), true),
    rand: s => utils.objectFromPairs(fts.map(([field, type]) => [field, type.rand(s)]))
  })
  .__name("Struct({"+fts.map(([field,type]) => field + ":" + type.__meta.name).join(",")+"})")
  .__desc("a struct with the fields " + fts.map(([field,type]) => "`" + field + "`" + " (`" + type.__meta.name + "`)").join(", ") + "");
};

T.Vector = (size, type) => T(T.Type, {
  form: "a JavaScript Array with `" + size + "` `" + type.__meta.name + "`s, where `" + type.__meta.name + "` is " + type.form,
  test: array => array instanceof Array && array.length === size && array.reduce((r,x) => r && type.test(x), true),
  rand: s => utils.generate(size, () => type.rand(s))
})
.__name("Vector(" + size + ")" + type.__meta.name + ")")
.__desc("a `Vector` of `" + size + " " + type.__meta.name + "`s");

T.Pair = (a, b) => T(T.Type, {
  form: "a JavaScript Array with a " + a.form + " and a " + b.form,
  test: pair => pair instanceof Array && pair.length === 2 && a.test(pair[0]) && b.test(pair[1]),
  rand: s => [a.rand(s), b.rand(s)]
})
.__name("Pair(" + a.__meta.name + "," + b.__meta.name + ")")
.__desc("a `Pair` of " + a.__meta.name + "` and " + b.__meta.name);

T.Array = type => T(T.Type, {
  form: "a JavaScript Array of `" + type.__meta.name + "`s, where `" + type.__meta.name + "` is " + type.form,
  test: value => value instanceof Array && value.reduce((r,x) => r && type.test(x), true),
  rand: s => utils.generate(Math.random() * (s ? 8 : 64) | 0, () => type.rand(s))
})
.__name("Array(" + type.__meta.name + ")")
.__desc("an `Array` of `" + type.__meta.name + "`s");

T.Map = (from, to) => T(T.Type, {
  form: "a JavaScript Object where keys are the JSON serialization of `"
    + from.__meta.name + "`s, and the values are `" + to.__meta.name + "`s, where `"
    + to.__meta.name + "` is `" + to.form + "` and `" + from.__meta.name + "` is `" + from.form + "`",
  test: object => {
    if (typeof object !== "object")
      return false;
    for (let k in object) {
      try {
        let key = JSON.parse(k);
        let val = object[k];
        if (!from.test(key) || !to.test(val))
          return false;
      } catch(e) {
        return false;
      }
    }
    return true;
  },
  rand: () => {
    // TODO
    return {};
  }
})
.__name("Map(" + from.__meta.name + "," + to.__meta.name + ")")
.__desc("a map from `" + from.__meta.name + "`s to `" + to.__meta.name +"`s");

T.Fn = (...argsRetr) => {
  let nextName = 0;
  argsRetr.map(arg => T(T.Type, arg));
  const names = "abcdefghijklmnopqrstuvwxyz";
  const asTuple = arg => arg.length !== 3 ? [arg, names[nextName++] || "_", ""] : arg;
  const argTuples = argsRetr.slice(0, -1).map(asTuple);
  const argTypes = argTuples.map(([type]) => type);
  const retTuple = asTuple(argsRetr[argsRetr.length - 1], 0);
  const typeName = type => type.__meta.name;
  const typeForm = type => type.form;
  const argName = arg => (arg[1] ? arg[1] + ": " : "") + typeName(arg[0]);
  return T(T.Type, {
    form: "a JavaScript Function that receives " + argTypes.map(typeForm).join(", ") + " and returns " + typeForm(retTuple[0]),
    test: fn => {
      if (!fn instanceof Function)
        return utils.flatten([
          ["Expected Function, got " + typeof fn + ":", " "],
          utils.showBlock(fn)]);
      for (let attempts = 0; attempts < (STATIC_TIME ? 256 : 1); ++attempts) {
        const testArgs = argTypes.map(type => type.rand(attempts < 32 ? 32 : null));
        const testRetr = fn.apply(this, testArgs);
        if (!retTuple[0].test(testRetr)) {
          return utils.flatten([
            ["Expected return type " + utils.color(34,typeName(retTuple[0])) + ". Got:", " "],
            utils.indent(utils.showBlock(testRetr)),
            [" ", "When calling the function:", " "],
            utils.indent(utils.showBlock(fn.__meta ? fn.__meta.term : fn).map((l,i) => i === 0 ? "  " + l : l)),
            [" ", "With the arguments:", " "],
            utils.indent(utils.flatten(testArgs.map(utils.showBlock))),
            [" "],
            utils.showBlock(retTuple[0])]);
          }
      }
      return true;
    },
    rand: s => eval("(" + argTuples.map(arg => arg[1]).join(",") + ") => " + utils.show(retTuple[0].rand(s))), // prettier static error reports,
    wrap: fn => function rec(...vars) {
      for (let i = 0, l = vars.length; i < l; ++i)
        T.check(argTypes[i], vars[i]);
      if (vars.length >= argTypes.length)
        return fn.apply(this, vars);
      else
        return (...moreVars) => rec(...vars.concat(moreVars));
    }
  })
  .__name("("+argTuples.map(argName).join(") ")+") => ("+argName(retTuple)+")")
  .__desc("a `Function` from `"+argTypes.map(typeName).join(", ")+"` to `"+typeName(retTuple[0])+"`");
};

let STATIC_TIME = true;
setTimeout(function() { STATIC_TIME = false; }, 1);

module.exports = T;
