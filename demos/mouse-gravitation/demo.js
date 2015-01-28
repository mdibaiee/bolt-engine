var world = new LiThree.World(),
    renderer = new LiThree.WebGLRenderer(window.innerWidth, window.innerHeight, world),
    camera = renderer.camera;

camera.position.z -= 10;

var light = new LiThree.Light.Point();
light.diffuseColor.hex = '#16A086';
light.position.x = -10;
light.position.z = -20;
light.position.y = 0;
world.add(light);

// renderer.canvas.style.setProperty('background', 'black');


var mouse = new Bolt.Particle({
  position: Bolt.Vector(0, 0, 0),
  mass: 1
});

var middle = new Bolt.Vector(window.innerWidth / 2, window.innerHeight / 2, 0);

for(var i = 0; i < 20; i++) {
  var p = new Bolt.Particle({
    position: middle.clone(),
    mass: 1
  });

  var sphere =  new LiThree.ObjectFactory.Sphere(50, 20, 20);
  sphere.color.rgb(0.2, 0.2, 0.2);

  world.add(sphere);

  p.view = sphere;
}

renderer.initShapes();

function syncPositions(particle) {
  particle.view.position.x = particle.position.x;
  particle.view.position.y = particle.position.y;
  particle.view.position.z = particle.position.z;
}

Bolt.configs.globalGravity = false;

Bolt.Play.start(function() {
  // i = 1 Ignore mouse
  for(var i = 1, len = Bolt.objects.length; i < len; i++) {
    var p = Bolt.objects[i];

    // var mouseGravity = new Bolt.Force.generators.Gravity(p, mouse);

    // Bolt.Force.add(p, mouseGravity);

    syncPositions(p);
  }

  renderer.draw();
});

document.body.appendChild(renderer.canvas);

renderer.canvas.addEventListener('mousemove', function(e) {
  mouse.position.x = e.pageX;
  mouse.position.y = e.pageY;
});