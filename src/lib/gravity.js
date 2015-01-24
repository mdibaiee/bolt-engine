import Vector from './vector';

var Gravity = {
  between: function(o1, o2) {
    var mass = o1.mass * o2.mass;
    return new Vector(
      Math.pow(o1.position.x - o2.position.x, 2),
      Math.pow(o1.position.y - o2.position.y, 2),
      Math.pow(o1.position.z - o2.position.z, 2)
    );
  },

  globalMass: 10,
  global: function(mass, g) {
    return new Vector(0, -mass * (g || this.globalMass), 0);
  }
};

export default Gravity;
