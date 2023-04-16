#version 300 es
precision highp float;
precision highp int;

uniform mediump sampler2D u_FBOTexture;
uniform mediump sampler2D _BaseTexture;
uniform float _Intensity;

in vec2 uv0;
layout(location = 0) out vec4 o_FragColor;

void main()
{
    vec4 color = texture(u_FBOTexture, uv0);
    float blueColor = color.z * 63.0;
    vec2 quad1;
    quad1.y = floor(floor(blueColor) / 8.0);
    quad1.x = floor(blueColor) - (quad1.y * 8.0);
    vec2 texPos1;
    texPos1.x = ((quad1.x * 0.125) + 0.0009765625) + (0.123046875 * color.x);
    texPos1.y = ((quad1.y * 0.125) + 0.0009765625) + (0.123046875 * color.y);
    mediump vec4 newColor = texture(_BaseTexture, texPos1);
    color = mix(color, newColor, vec4(_Intensity));
    o_FragColor = color;
}

