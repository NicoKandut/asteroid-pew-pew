precision mediump float; 

attribute vec2 in_position;
// attribute lowp vec4 in_color;

// out_color
varying vec4 out_color;

void main() {
    gl_Position = vec4(in_position, 0, 1);
    // out_color = in_color;
    out_color = vec4(1.0, 0.0, 0.0, 1.0);
}