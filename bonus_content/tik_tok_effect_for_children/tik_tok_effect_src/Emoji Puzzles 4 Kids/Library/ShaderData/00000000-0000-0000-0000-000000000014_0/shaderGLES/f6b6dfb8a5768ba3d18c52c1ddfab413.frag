#version 300 es
precision highp float;
precision highp int;

uniform mediump sampler2D _BaseTexture;
uniform vec4 _BaseColor;
uniform float _Opacity;
uniform vec4 u_WorldSpaceCameraPos;

in vec2 g_vary_uv0;
in vec4 v_sampling_pos;
layout(location = 0) out vec4 glResult;
in vec4 v_background_pos;
in vec3 v_worldPos;
in vec3 v_Normal;

void main()
{
    vec2 uv = g_vary_uv0;
    uv.y = 1.0 - uv.y;
    vec2 sampling_uv = ((v_sampling_pos.xy / vec2(v_sampling_pos.w)) * 0.5) + vec2(0.5);
    vec4 texColor = texture(_BaseTexture, uv) * _BaseColor;
    texColor.w *= _Opacity;
    if (texColor.w == 0.0)
    {
        discard;
    }
    glResult = texColor;
}

