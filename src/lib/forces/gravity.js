import Vector from '../vector';
import Bolt from '../../main';

function Gravity(o1, o2) {
  var mass = o1.mass * o2.mass;
  var g = Bolt.ugravitation || 10;
  var acc = mass*g;

  var distance = new Vector(
    o1.position.x - o2.position.x,
    o1.position.y - o2.position.y,
    o1.position.z - o2.position.z
  );

  this.force = new Vector(
    acc / (distance.x*distance.x),
    acc / (distance.y*distance.y),
    acc / (distance.z*distance.z)
  );
}

Gravity.prototype.apply = function(particle, duration) {
  particle.acceleration.add(this.force);
};

export default Gravity;