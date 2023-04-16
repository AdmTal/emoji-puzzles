#version 300 es
precision highp float;
precision highp int;

uniform mediump sampler2D u_FBOTexture;
uniform float radius;

in vec2 screenUV;
layout(location = 0) out vec4 o_FragColor;
in vec2 orgUV;
in vec2 modelScale;

void main()
{
    mediump vec4 finalColor = texture(u_FBOTexture, screenUV);
    o_FragColor = finalColor;
}

