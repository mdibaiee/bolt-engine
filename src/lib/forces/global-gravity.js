import Vector from '../vector';
import Bolt from '../../main';

function GlobalGravity(mass, g = Bolt.ugravitation || 10) {
  this.force = new Vector(0, -mass*g, 0);
}

GlobalGravity.prototype.apply = function(particle, duration) {
  particle.acceleration.add(this.force);
};

export default GlobalGravity;