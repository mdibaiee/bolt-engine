import Vector from './vector';
import Bolt from '../main';

function Particle(properties = {}) {
  if(!(this instanceof Particle)) return new Particle(properties);

  this.position = properties.position || new Vector();
  this.velocity = properties.velocity || new Vector();
  this.acceleration = properties.acceleration || new Vector();

  this.damping = properties.damping || 0.95;
  this.mass = properties.mass || 10;

  Bolt.objects.push(this);
}

Object.defineProperties(Particle.prototype, {
  mass: {
    configurable: true,
    enumerable: true,
    get: function() {
      return 1 / this.inverseMass;
    },
    set: function(val) {
      if(val === 0) this.inverseMass = Infinity;
      else this.inverseMass = 1/val;
    }
  }
});

Particle.prototype.destroy = function() {
  return Bolt.objects.splice(Bolt.objects.indexOf(this), 1);
}

export default Particle;