#version 300 es

uniform mat4 u_MVP;

layout(location = 0) in vec3 attPosition;

void main()
{
    vec4 homogeneous_pos = vec4(attPosition, 1.0);
    gl_Position = u_MVP * homogeneous_pos;
}

