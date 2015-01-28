import Frames from './frames';
import Force from './force';
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
        var avg = Frames.tick(now);

        for(var i = 0, len = Bolt.objects.length; i < len; i++) {
          var object = Bolt.objects[i];

          if(Bolt.configs.globalGravity) {
            var gravity = new Force.generators.GlobalGravity(object.mass);
            Force.add(object, gravity);
          }

          object.position.add(object.velocity.clone().scalar(Frames.elapsed));
            // object.velocity.scalar(Math.pow(object.damping, Frames.elapsed));

          object.acceleration.scalar(Frames.elapsed);
          object.velocity.add(object.acceleration);

          Force.run();
          Force.clear();
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
