"use strict";

"format register";
(function (global) {
  var defined = {};

  // indexOf polyfill for IE8
  var indexOf = Array.prototype.indexOf || function (item) {
    for (var i = 0,
        l = this.length; i < l; i++) if (this[i] === item) return i;
    return -1;
  };

  function dedupe(deps) {
    var newDeps = [];
    for (var i = 0,
        l = deps.length; i < l; i++) if (indexOf.call(newDeps, deps[i]) == -1) newDeps.push(deps[i]);
    return newDeps;
  }

  function register(name, deps, declare, execute) {
    if (typeof name != "string") throw "System.register provided no module name";

    var entry;

    // dynamic
    if (typeof declare == "boolean") {
      entry = {
        declarative: false,
        deps: deps,
        execute: execute,
        executingRequire: declare
      };
    } else {
      // ES6 declarative
      entry = {
        declarative: true,
        deps: deps,
        declare: declare
      };
    }

    entry.name = name;

    // we never overwrite an existing define
    if (!defined[name]) defined[name] = entry;

    entry.deps = dedupe(entry.deps);

    // we have to normalize dependencies
    // (assume dependencies are normalized for now)
    // entry.normalizedDeps = entry.deps.map(normalize);
    entry.normalizedDeps = entry.deps;
  }

  function buildGroups(entry, groups) {
    groups[entry.groupIndex] = groups[entry.groupIndex] || [];

    if (indexOf.call(groups[entry.groupIndex], entry) != -1) return;

    groups[entry.groupIndex].push(entry);

    for (var i = 0,
        l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];

      // not in the registry means already linked / ES6
      if (!depEntry || depEntry.evaluated) continue;

      // now we know the entry is in our unlinked linkage group
      var depGroupIndex = entry.groupIndex + (depEntry.declarative != entry.declarative);

      // the group index of an entry is always the maximum
      if (depEntry.groupIndex === undefined || depEntry.groupIndex < depGroupIndex) {
        // if already in a group, remove from the old group
        if (depEntry.groupIndex !== undefined) {
          groups[depEntry.groupIndex].splice(indexOf.call(groups[depEntry.groupIndex], depEntry), 1);

          // if the old group is empty, then we have a mixed depndency cycle
          if (groups[depEntry.groupIndex].length == 0) throw new TypeError("Mixed dependency cycle detected");
        }

        depEntry.groupIndex = depGroupIndex;
      }

      buildGroups(depEntry, groups);
    }
  }

  function link(name) {
    var startEntry = defined[name];

    startEntry.groupIndex = 0;

    var groups = [];

    buildGroups(startEntry, groups);

    var curGroupDeclarative = !!startEntry.declarative == groups.length % 2;
    for (var i = groups.length - 1; i >= 0; i--) {
      var group = groups[i];
      for (var j = 0; j < group.length; j++) {
        var entry = group[j];

        // link each group
        if (curGroupDeclarative) linkDeclarativeModule(entry);else linkDynamicModule(entry);
      }
      curGroupDeclarative = !curGroupDeclarative;
    }
  }

  // module binding records
  var moduleRecords = {};
  function getOrCreateModuleRecord(name) {
    return moduleRecords[name] || (moduleRecords[name] = {
      name: name,
      dependencies: [],
      exports: {}, // start from an empty module and extend
      importers: []
    });
  }

  function linkDeclarativeModule(entry) {
    // only link if already not already started linking (stops at circular)
    if (entry.module) return;

    var module = entry.module = getOrCreateModuleRecord(entry.name);
    var exports = entry.module.exports;

    var declaration = entry.declare.call(global, function (name, value) {
      module.locked = true;
      exports[name] = value;

      for (var i = 0,
          l = module.importers.length; i < l; i++) {
        var importerModule = module.importers[i];
        if (!importerModule.locked) {
          var importerIndex = indexOf.call(importerModule.dependencies, module);
          importerModule.setters[importerIndex](exports);
        }
      }

      module.locked = false;
      return value;
    });

    module.setters = declaration.setters;
    module.execute = declaration.execute;

    if (!module.setters || !module.execute) throw new TypeError("Invalid System.register form for " + entry.name);

    // now link all the module dependencies
    for (var i = 0,
        l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];
      var depModule = moduleRecords[depName];

      // work out how to set depExports based on scenarios...
      var depExports;

      if (depModule) {
        depExports = depModule.exports;
      } else if (depEntry && !depEntry.declarative) {
        depExports = { "default": depEntry.module.exports, __useDefault: true };
      }
      // in the module registry
      else if (!depEntry) {
        depExports = load(depName);
      }
      // we have an entry -> link
      else {
        linkDeclarativeModule(depEntry);
        depModule = depEntry.module;
        depExports = depModule.exports;
      }

      // only declarative modules have dynamic bindings
      if (depModule && depModule.importers) {
        depModule.importers.push(module);
        module.dependencies.push(depModule);
      } else module.dependencies.push(null);

      // run the setter for this dependency
      if (module.setters[i]) module.setters[i](depExports);
    }
  }

  // An analog to loader.get covering execution of all three layers (real declarative, simulated declarative, simulated dynamic)
  function getModule(name) {
    var exports;
    var entry = defined[name];

    if (!entry) {
      exports = load(name);
      if (!exports) throw new Error("Unable to load dependency " + name + ".");
    } else {
      if (entry.declarative) ensureEvaluated(name, []);else if (!entry.evaluated) linkDynamicModule(entry);

      exports = entry.module.exports;
    }

    if ((!entry || entry.declarative) && exports && exports.__useDefault) return exports["default"];

    return exports;
  }

  function linkDynamicModule(entry) {
    if (entry.module) return;

    var exports = {};

    var module = entry.module = { exports: exports, id: entry.name };

    // AMD requires execute the tree first
    if (!entry.executingRequire) {
      for (var i = 0,
          l = entry.normalizedDeps.length; i < l; i++) {
        var depName = entry.normalizedDeps[i];
        var depEntry = defined[depName];
        if (depEntry) linkDynamicModule(depEntry);
      }
    }

    // now execute
    entry.evaluated = true;
    var output = entry.execute.call(global, function (name) {
      for (var i = 0,
          l = entry.deps.length; i < l; i++) {
        if (entry.deps[i] != name) continue;
        return getModule(entry.normalizedDeps[i]);
      }
      throw new TypeError("Module " + name + " not declared as a dependency.");
    }, exports, module);

    if (output) module.exports = output;
  }

  /*
   * Given a module, and the list of modules for this current branch,
   *  ensure that each of the dependencies of this module is evaluated
   *  (unless one is a circular dependency already in the list of seen
   *  modules, in which case we execute it)
   *
   * Then we evaluate the module itself depth-first left to right 
   * execution to match ES6 modules
   */
  function ensureEvaluated(moduleName, seen) {
    var entry = defined[moduleName];

    // if already seen, that means it's an already-evaluated non circular dependency
    if (entry.evaluated || !entry.declarative) return;

    // this only applies to declarative modules which late-execute

    seen.push(moduleName);

    for (var i = 0,
        l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      if (indexOf.call(seen, depName) == -1) {
        if (!defined[depName]) load(depName);else ensureEvaluated(depName, seen);
      }
    }

    if (entry.evaluated) return;

    entry.evaluated = true;
    entry.module.execute.call(global);
  }

  // magical execution function
  var modules = {};
  function load(name) {
    if (modules[name]) return modules[name];

    var entry = defined[name];

    // first we check if this module has already been defined in the registry
    if (!entry) throw "Module " + name + " not present.";

    // recursively ensure that the module and all its
    // dependencies are linked (with dependency group handling)
    link(name);

    // now handle dependency execution in correct order
    ensureEvaluated(name, []);

    // remove from the registry
    defined[name] = undefined;

    var module = entry.declarative ? entry.module.exports : { "default": entry.module.exports, __useDefault: true };

    // return the defined module object
    return modules[name] = module;
  };

  return function (main, declare) {
    var System;

    // if there's a system loader, define onto it
    if (typeof System != "undefined" && System.register) {
      declare(System);
      System["import"](main);
    }
    // otherwise, self execute
    else {
      declare(System = {
        register: register,
        get: load,
        set: function (name, module) {
          modules[name] = module;
        },
        newModule: function (module) {
          return module;
        },
        global: global
      });
      load(main);
    }
  };
})(typeof window != "undefined" ? window : global)
/* ('mainModule', function(System) {
  System.register(...);
}); */

("src/main", function (System) {




  System.register("src/lib/vector", [], true, function (require, exports, module) {
    var global = System.global,
        __define = global.define;
    global.define = undefined;
    function Vector() {
      var x = arguments[0] === undefined ? 0 : arguments[0];
      var y = arguments[1] === undefined ? 0 : arguments[1];
      var z = arguments[2] === undefined ? 0 : arguments[2];
      if (!(this instanceof Vector)) return new Vector(x, y, z);
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
    Vector.prototype.invert = function () {
      this.x = -this.x;
      this.y = -this.y;
      this.z = -this.z;
    };
    Vector.prototype.magnitude = function () {
      return Math.sqrt(this.magnitude2());
    };
    Vector.prototype.magnitude2 = function () {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    };
    Vector.prototype.normalize = function () {
      var magnitude = this.magnitude();
      if (this.magnitude() <= 0) return this;
      return this.scalar(1 / magnitude);
    };
    Vector.prototype.scalar = function () {
      var n = arguments[0] === undefined ? 1 : arguments[0];
      this.x *= n;
      this.y *= n;
      this.z *= n;
      return this;
    };
    Vector.prototype.clone = function () {
      return new Vector(this.x, this.y, this.z);
    };
    Vector.prototype.add = function (vec) {
      this.x += vec.x;
      this.y += vec.y;
      this.z += vec.z;
      return this;
    };
    Vector.prototype.component = function (vec) {
      this.x *= vec.x;
      this.y *= vec.y;
      this.z *= vec.z;
      return this;
    };
    Vector.prototype.dot = function (vec) {
      return this.x * vec.x + this.y * vec.y + this.z * vec.z;
    };
    Vector.prototype.cross = function (vec) {
      this.x = this.y * vec.z - this.z * vec.y;
      this.y = this.x * vec.z - this.z * vec.x;
      this.z = this.x * vec.y - this.y * vec.x;
      return this;
    };
    Vector.orthonormal = function (v1, v2) {
      var v1xv2 = v1.clone().cross(v2);
      v2 = v1xv2.clone().cross(v1);
      return [v1.normalize(), v2.normalize(), v1xv2.normalize()];
    };
    function randomRange(min, max) {
      return Math.random() * (max - min) + min;
    }
    Vector.random = function (x, y, z) {
      return new Vector(randomRange(x[0], x[1]), randomRange(y[0], y[1]), randomRange(z[0], z[1]));
    };
    function killNaN(a) {
      if (isNaN(a)) return 0;
      return a;
    }
    module.exports = Vector;
    global.define = __define;
    return module.exports;
  });



  System.register("src/lib/particle", ["src/lib/vector", "src/main"], function ($__export) {
    "use strict";
    var __moduleName = "src/lib/particle";
    var Vector, Bolt;
    function Particle() {
      var properties = arguments[0] !== void 0 ? arguments[0] : {};
      if (!(this instanceof Particle)) return new Particle(properties);
      this.position = properties.position || new Vector();
      this.velocity = properties.velocity || new Vector();
      this.acceleration = properties.acceleration || new Vector();
      this.damping = properties.damping || 0.95;
      this.mass = properties.mass || 10;
      Bolt.objects.push(this);
    }
    return {
      setters: [function (m) {
        Vector = m["default"];
      }, function (m) {
        Bolt = m["default"];
      }],
      execute: function () {
        Object.defineProperties(Particle.prototype, { mass: {
            configurable: true,
            enumerable: true,
            get: function () {
              return 1 / this.inverseMass;
            },
            set: function (val) {
              if (val === 0) this.inverseMass = Infinity;else this.inverseMass = 1 / val;
            }
          } });
        Particle.prototype.destroy = function () {
          return Bolt.objects.splice(Bolt.objects.indexOf(this), 1);
        };
        $__export("default", Particle);
      }
    };
  });



  System.register("src/lib/gravity", ["src/lib/vector"], function ($__export) {
    "use strict";
    var __moduleName = "src/lib/gravity";
    var Vector, Gravity;
    return {
      setters: [function (m) {
        Vector = m["default"];
      }],
      execute: function () {
        Gravity = {
          between: function (o1, o2) {
            var mass = o1.mass * o2.mass;
            return new Vector(Math.pow(o1.position.x - o2.position.x, 2), Math.pow(o1.position.y - o2.position.y, 2), Math.pow(o1.position.z - o2.position.z, 2));
          },
          globalMass: 10,
          global: function (mass, g) {
            return new Vector(0, -mass * (g || this.globalMass), 0);
          }
        };
        $__export("default", Gravity);
      }
    };
  });



  System.register("src/lib/frames", [], function ($__export) {
    "use strict";
    var __moduleName = "src/lib/frames";
    var Frames;
    return {
      setters: [],
      execute: function () {
        Frames = {
          lastFrame: 0,
          elapsed: 0,
          average: 0,
          fps: 0,
          tick: function (now) {
            this.elapsed = (now - (this.lastFrame || now)) / 1000;
            this.lastFrame = now;
            if (this.elapsed > 0) this.fps = Math.round(1 / this.elapsed);
            this.average = Math.round((this.average + this.fps) / 2);
            return this.average;
          }
        };
        $__export("default", Frames);
      }
    };
  });



  System.register("src/lib/forces/global-gravity", ["src/lib/vector", "src/main"], function ($__export) {
    "use strict";
    var __moduleName = "src/lib/forces/global-gravity";
    var Vector, Bolt;
    function GlobalGravity(mass) {
      var g = arguments[1] !== void 0 ? arguments[1] : Bolt.ugravitation || 10;
      this.force = new Vector(0, -mass * g, 0);
    }
    return {
      setters: [function (m) {
        Vector = m["default"];
      }, function (m) {
        Bolt = m["default"];
      }],
      execute: function () {
        GlobalGravity.prototype.apply = function (particle, duration) {
          particle.acceleration.add(this.force);
        };
        $__export("default", GlobalGravity);
      }
    };
  });



  System.register("src/lib/forces/gravity", ["src/lib/vector", "src/main"], function ($__export) {
    "use strict";
    var __moduleName = "src/lib/forces/gravity";
    var Vector, Bolt;
    function Gravity(o1, o2) {
      var mass = o1.mass * o2.mass;
      var g = Bolt.ugravitation || 10;
      var acc = mass * g;
      var distance = new Vector(o1.position.x - o2.position.x, o1.position.y - o2.position.y, o1.position.z - o2.position.z);
      this.force = new Vector(acc / (distance.x * distance.x), acc / (distance.y * distance.y), acc / (distance.z * distance.z));
    }
    return {
      setters: [function (m) {
        Vector = m["default"];
      }, function (m) {
        Bolt = m["default"];
      }],
      execute: function () {
        Gravity.prototype.apply = function (particle, duration) {
          particle.acceleration.add(this.force);
        };
        $__export("default", Gravity);
      }
    };
  });



  System.register("src/lib/force", ["src/lib/vector", "src/lib/forces/global-gravity", "src/lib/forces/gravity"], function ($__export) {
    "use strict";
    var __moduleName = "src/lib/force";
    var Vector, GlobalGravity, Gravity, Force;
    return {
      setters: [function (m) {
        Vector = m["default"];
      }, function (m) {
        GlobalGravity = m["default"];
      }, function (m) {
        Gravity = m["default"];
      }],
      execute: function () {
        Force = {
          registry: [],
          generators: {
            GlobalGravity: GlobalGravity,
            Gravity: Gravity
          },
          add: function (particle, force) {
            this.registry.push([particle, force]);
            return this.forces;
          },
          remove: function (particle, force) {
            var reg = this.registry;
            this.registry.forEach(function (el, i) {
              if (el[0] === particle && el[1] === force) reg.splice(i, 1);
            });
          },
          clear: function () {
            this.registry.length = 0;
          },
          run: function (duration) {
            this.registry.forEach(function (el) {
              el[1].apply(el[0], duration);
            });
          }
        };
        $__export("default", Force);
      }
    };
  });



  System.register("src/lib/play", ["src/lib/frames", "src/lib/force", "src/main"], function ($__export) {
    "use strict";
    var __moduleName = "src/lib/play";
    var Frames, Force, Bolt, reqAnimFrame, cancelAnimFrame, Play;
    return {
      setters: [function (m) {
        Frames = m["default"];
      }, function (m) {
        Force = m["default"];
      }, function (m) {
        Bolt = m["default"];
      }],
      execute: function () {
        reqAnimFrame = requestAnimationFrame || webkitRequestAnimationFrame || mozRequestAnimationFrame || oRequestAnimationFrame || msRequestAnimationFrame, cancelAnimFrame = cancelAnimationFrame || webkitCancelAnimationFrame || mozCancelAnimationFrame || oCancelAnimationFrame || msCancelAnimationFrame;
        Play = {
          playing: false,
          start: function (fn) {
            Frames.tick(Date.now());
            (function loop() {
              reqAnimFrame(function (now) {
                var avg = Frames.tick(now);
                for (var i = 0,
                    len = Bolt.objects.length; i < len; i++) {
                  var object = Bolt.objects[i];
                  if (Bolt.configs.globalGravity) {
                    var gravity = new Force.generators.GlobalGravity(object.mass);
                    Force.add(object, gravity);
                  }
                  object.position.add(object.velocity.clone().scalar(Frames.elapsed));
                  object.acceleration.scalar(Frames.elapsed);
                  object.velocity.add(object.acceleration);
                  Force.run();
                  Force.clear();
                }
                if (fn) fn.apply(this, arguments);
                loop();
              });
            })();
            this.playing = true;
            return new Promise(function (resolve) {
              setTimeout(resolve, 5);
            });
          },
          stop: function () {
            cancelAnimFrame();
            this.playing = false;
          }
        };
        $__export("default", Play);
      }
    };
  });



  System.register("src/main", ["src/lib/vector", "src/lib/particle", "src/lib/gravity", "src/lib/frames", "src/lib/play", "src/lib/force"], function ($__export) {
    "use strict";
    var __moduleName = "src/main";
    var Vector, Particle, Gravity, Frames, Play, Force, Bolt;
    return {
      setters: [function (m) {
        Vector = m["default"];
      }, function (m) {
        Particle = m["default"];
      }, function (m) {
        Gravity = m["default"];
      }, function (m) {
        Frames = m["default"];
      }, function (m) {
        Play = m["default"];
      }, function (m) {
        Force = m["default"];
      }],
      execute: function () {
        Bolt = {
          configs: { globalGravity: true },
          config: function (o) {
            for (var i in o) {
              this.configs[i] = o[i];
            }
            return this.configs;
          },
          objects: [],
          Vector: Vector,
          Particle: Particle,
          Gravity: Gravity,
          Frames: Frames,
          Play: Play,
          Force: Force
        };
        window.Bolt = Bolt;
        $__export("default", Bolt);
      }
    };
  });



});
//# sourceMappingURL=build.js.map
