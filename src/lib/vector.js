function Vector(x = 0, y = 0, z = 0) {
  if(!(this instanceof Vector)) return new Vector(x, y, z);

  this.x = x;
  this.y = y;
  this.z = z;

  return this;
}

Vector.prototype.invert = function() {
  this.x = -this.x;
  this.y = -this.y;
  this.z = -this.z;
};

Vector.prototype.magnitude = function() {
  return Math.sqrt(this.magnitude2());
};

Vector.prototype.magnitude2 = function() {
  return this.x*this.x + this.y*this.y + this.z*this.z;
};

Vector.prototype.normalize = function() {
  var magnitude = this.magnitude();
  if(this.magnitude() <= 0) return this;

  return this.scalar(1/magnitude);
};

Vector.prototype.scalar = function(n = 1) {
  this.x *= n;
  this.y *= n;
  this.z *= n;

  return this;
};

Vector.prototype.clone = function() {
  return new Vector(this.x, this.y, this.z);
};

Vector.prototype.add = function(vec) {
  this.x += vec.x;
  this.y += vec.y;
  this.z += vec.z;

  return this;
};

Vector.prototype.component = function(vec) {
  this.x *= vec.x;
  this.y *= vec.y;
  this.z *= vec.z;

  return this;
};

Vector.prototype.dot = function(vec) {
  return this.x*vec.x + this.y*vec.y + this.z*vec.z;
};

Vector.prototype.cross = function(vec) {
  this.x = this.y*vec.z - this.z*vec.y;
  this.y = this.x*vec.z - this.z*vec.x;
  this.z = this.x*vec.y - this.y*vec.x;
  return this;
};

Vector.orthonormal = function(v1, v2) {
  var v1xv2 = v1.clone().cross(v2);
  v2 = v1xv2.clone().cross(v1);
  return [
    v1.normalize(),
    v2.normalize(),
    v1xv2.normalize()
  ];
};

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

Vector.random = function(x, y, z) {
  return new Vector(randomRange(x[0], x[1]), randomRange(y[0], y[1]), randomRange(z[0], z[1]));
};

function killNaN(a) {
  if(isNaN(a)) return 0;
  return a;
}

module.exports = Vector;