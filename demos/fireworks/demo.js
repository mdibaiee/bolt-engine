var scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000),
    renderer = new THREE.WebGLRenderer(),
    light = new THREE.HemisphereLight(0xf0f0f0, 0x404040);

camera.position.z = 1000;
renderer.setSize(window.innerWidth, window.innerHeight);

var cubeGeometry = new THREE.SphereGeometry(7, 8, 8),
    redMaterial = new THREE.MeshLambertMaterial({color: 0xFF2200}),
    orangeMaterial = new THREE.MeshLambertMaterial({color: 0xFFFB00});

scene.add(light);

document.body.appendChild(renderer.domElement);


function Firework(props) {
  this.particle = Bolt.Particle(props);
  this.type = props.type || 0;
  this.age = Math.random() * (5 - 3) + 3;
  this.particle.damping = 0.93;
  this.particle.velocity = props.velocity || Bolt.Vector.random([-8, 8], [60, 12], [-8, 8]);

  this.view = new THREE.Mesh(cubeGeometry, this.type === 0 ? redMaterial : orangeMaterial);
  if(this.type === 1) {
    this.view.scale.x = 0.5;
    this.view.scale.y = 0.5;
    this.view.scale.z = 0.5;
  }
  this.render();
  scene.add(this.view);
}

Firework.prototype.render = function() {
  this.view.position.x = this.particle.position.x;
  this.view.position.y = this.particle.position.y;
  this.view.position.z = this.particle.position.z;
};

Firework.prototype.destroy = function() {
  this.particle.destroy();
  scene.remove(this.view);
  this.view = null;
};

var fireworks = [];

var count = 0;

Bolt.Play.start(function() {
  count++;

  if(count === 8) {
    fireworks.push(new Firework({
      type: 0,
      position: Bolt.Vector(window.innerWidth/4, 0, 0),
      mass: 2
    }));
    count = 0;
  }

  for(var i = 0, len = fireworks.length; i < len; i++) {
    var fw = fireworks[i];
    fw.render();

    fw.age -= Bolt.Frames.elapsed;
    if(fw.age < 0) {
      fw.destroy();
      fireworks.splice(i, 1);
      i--;
      len--;

      if(fw.type === 1) continue;

      for(var x = 0; x < 3; x++) {
        var vel = fw.particle.velocity.clone().add(Bolt.Vector.random([-8, 8], [-10, 10], [-8, 8]));
        var childFirework = new Firework({
          type: 1,
          position: fw.particle.position.clone(),
          velocity: vel,
          mass: 1
        });
        fireworks.push(childFirework);
      }
    }
  }

  renderer.render(scene, camera);
}).then(function() {

});

var isMouseDown = false,
    initial = {x: 0, y: 0},
    last = {x: 0, y: 0};

renderer.domElement.style.setProperty('cursor', 'pointer');

renderer.domElement.addEventListener('mousedown', function(e) {
  isMouseDown = true;
  initial.x = e.pageX;
  initial.y = e.pageY;
  renderer.domElement.style.setProperty('cursor', 'grab');
});

renderer.domElement.addEventListener('mousemove', function(e) {
  if(!isMouseDown) return;
  camera.position.x = last.x + initial.x - e.pageX;
  camera.position.y = last.y + -(initial.y - e.pageY);
});

renderer.domElement.addEventListener('mouseup', function(e) {
  isMouseDown = false;
  last.x = camera.position.x;
  last.y = camera.position.y;
  renderer.domElement.style.setProperty('cursor', 'pointer');
});

renderer.domElement.addEventListener('wheel', function(e) {
  camera.position.z += e.deltaY * 10;
});