import Frames from './frames';
import Gravity from './gravity';
import Bolt from '../main';


var reqAnimFrame = requestAnimationFrame ||
                   webkitRequestAnimationFrame ||
                   mozRequestAnimationFrame ||
                   oRequestAnimationFrame ||
                   msRequestAnimationFrame,

  cancelAnimFrame = cancelAnimationFrame ||
                    webkitCancelAnimationFrame ||
                    mozCancelAnimationFrame ||
                    oCancelAnimationFrame ||
                    msCancelAnimationFrame;

var Play = {
  playing: false,
  start: function(fn) {
    Frames.tick(Date.now());

    (function loop() {
      reqAnimFrame(function(now) {
        // ctx.clearRect(0, 0, canvas.width, canvas.height);
        // ctx.fillStyle = 'black';
        // ctx.fillRect(0, 0, canvas.width, canvas.height);
        var avg = Frames.tick(now);

        for(var i = 0, len = Bolt.objects.length; i < len; i++) {
          var object = Bolt.objects[i];

          if(Bolt.configs.globalGravity) {
            var force = Gravity.global(object.inverseMass);

            object.position.add(object.velocity.clone().scalar(Frames.elapsed));

            var acc = object.acceleration.clone();
            acc.add(force);
            object.velocity.add(acc.scalar(Frames.elapsed));
            object.velocity.scalar(Math.pow(object.damping, Frames.elapsed));

            // ctx.beginPath();
            // ctx.fillStyle = object.color;
            // ctx.arc(object.position.x, object.position.y, object.mass, 0, 2*Math.PI);
            // ctx.fill();
          }
        }

        if(fn) fn.apply(this, arguments);

        loop();
      });
    })();

    this.playing = true;


    return new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
  },
  stop: function() {
    cancelAnimFrame();
    this.playing = false;
  }
};

export default Play;
