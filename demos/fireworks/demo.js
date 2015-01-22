function Firework(props) {
  var particle = Bolt.Particle(props);
  particle.type = props.type || 0;
  particle.age = Math.random() * (5 - 3) + 3;
  particle.damping = 0.93;
  particle.velocity = props.velocity || Bolt.Vector.random([-8, 8], [-60, -12], [-5, 0]);
  particle.color = props.color;
  return particle;
}

var fireworks = [];

var count = 0;

Bolt.Play.start(function() {

  count++;
  if(count === 8) {
    fireworks.push(new Firework({
      type: 0,
      position: Bolt.Vector(Bolt._canvas.width/2, Bolt._canvas.height/2, 0),
      color: '#FF3636',
      mass: 2
    }));
    count = 0;
  }

  for(var i = 0, len = fireworks.length; i < len; i++) {
    var fw = fireworks[i];
    fw.age -= Bolt.Frames.elapsed;
    if(fw.age < 0) {
      fw.destroy();
      fireworks.splice(i, 1);
      i--;
      len--;

      if(fw.type === 1) continue;

      for(var x = 0; x < 5; x++) {
        var vel = fw.velocity.clone().add(Bolt.Vector.random([-8, 8], [-10, 10], [-5, 5]));
        var childFirework = new Firework({
          type: 1,
          position: fw.position.clone(),
          velocity: vel,
          color: '#FFA400',
          mass: 1
        });
        fireworks.push(childFirework);
      }
    }
  }

}).then(function() {

});