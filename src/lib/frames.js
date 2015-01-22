var Frames = {
  lastFrame: 0, // A date
  elapsed: 0,
  average: 0,
  fps: 0,
  tick: function(now) {
    this.elapsed = (now - (this.lastFrame || now)) / 1000; // difference between times, converted to seconds
    this.lastFrame = now;

    if(this.elapsed > 0)
      this.fps = Math.round(1 / this.elapsed);

    this.average = Math.round((this.average + this.fps) / 2);
    return this.average;
  }
};

export default Frames;
