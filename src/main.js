import Vector from './lib/vector';
import Particle from './lib/particle';
import Gravity from './lib/gravity';
import Frames from './lib/frames';
import Play from './lib/play';

var Bolt = {
  configs: {
    globalGravity: true,
    canvas: function() {
      var canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      document.body.appendChild(canvas);

      return canvas;
    }
  },

  config: function(o) {
    for(var i in o) {
      this.configs[i] = o[i];
    }
    return this.configs;
  },

  objects: [],

  Vector: Vector,
  Particle: Particle,
  Gravity: Gravity,
  Frames: Frames,
  Play: Play
};

window.Bolt = Bolt;

export default Bolt;