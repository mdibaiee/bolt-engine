import Vector from './vector';
import GlobalGravity from './forces/global-gravity';
import Gravity from './forces/gravity';

var Force = {
  registry: [],
  generators: {
    GlobalGravity: GlobalGravity,
    Gravity: Gravity
  },
  add: function(particle, force) {
    this.registry.push([particle, force]);

    return this.forces;
  },
  remove: function(particle, force) {
    var reg = this.registry;
    this.registry.forEach(function(el, i) {
      if(el[0] === particle && el[1] === force) reg.splice(i, 1);
    });
  },
  clear: function() {
    this.registry.length = 0;
  },
  run: function(duration) {
    this.registry.forEach(function(el) {
      // force.run(particle, duration);
      el[1].apply(el[0], duration);
    });
  }
};

export default Force;