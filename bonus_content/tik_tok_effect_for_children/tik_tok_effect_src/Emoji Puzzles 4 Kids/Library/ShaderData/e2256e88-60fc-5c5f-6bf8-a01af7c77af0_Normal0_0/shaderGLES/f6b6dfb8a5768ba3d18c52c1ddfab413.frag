#version 300 es
precision highp float;
precision highp int;

uniform mediump sampler2D _MainTex;
uniform vec4 u_color;
uniform float u_opacity;

in vec2 v_texCoord;
layout(location = 0) out vec4 o_fragColor;

vec4 getBaseColor()
{
    vec2 uv = v_texCoord;
    vec4 texColor = texture(_MainTex, uv);
    return texColor;
}

void main()
{
    vec4 baseColor = getBaseColor();
    vec4 imageColor = (baseColor * u_color) * u_opacity;
    o_fragColor = imageColor;
}

