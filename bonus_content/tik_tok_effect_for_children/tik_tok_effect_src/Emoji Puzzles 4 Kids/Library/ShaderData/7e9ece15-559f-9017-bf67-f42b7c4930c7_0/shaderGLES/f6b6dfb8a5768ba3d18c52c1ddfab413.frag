#version 300 es
precision highp float;
precision highp int;

const vec2 _107[10] = vec2[](vec2(1.440000057220458984375, 1.2999999523162841796875), vec2(1.440000057220458984375, 3.8599998950958251953125), vec2(1.46000003814697265625, 6.570000171661376953125), vec2(1.57700002193450927734375, 9.3500003814697265625), vec2(1.53400003910064697265625, 11.8500003814697265625), vec2(5.21000003814697265625, 1.35000002384185791015625), vec2(5.27600002288818359375, 3.8599998950958251953125), vec2(5.235000133514404296875, 6.5799999237060546875), vec2(5.11999988555908203125, 9.3500003814697265625), vec2(5.2189998626708984375, 11.89000034332275390625));

uniform mediump sampler2D _MainTex;
uniform mediump sampler2D _MaskTex;
uniform mediump int _LeftEyes;
uniform mediump int _RightEyes;
uniform mediump sampler2D _EyeTex;
uniform float _OpacityEnable;
uniform mediump sampler2D _OpacityTex;
uniform vec4 _Color;
uniform float _Intensity;
uniform float _ReflectionEnable;
uniform mediump sampler2D _ReflectionTex;
uniform float _ReflectionIntensity;

in vec2 uv0;
layout(location = 0) out vec4 o_FragColor;

vec3 ApplyBlendMode(vec3 base, vec3 blend, float opacity)
{
    vec3 ret = blend;
    return ret;
}

vec3 ApplyReflectBlendMode(vec3 base, vec3 blend, float opacity)
{
    vec3 ret = blend;
    return ret;
}

void main()
{
    vec4 background = texture(_MainTex, uv0);
    float mask = texture(_MaskTex, uv0).x;
    vec4 eye = vec4(0.0);
    for (mediump int i = _LeftEyes; i < _RightEyes; i++)
    {
        vec2 uvMapped = (uv0 * vec2(7.650000095367431640625, 13.59999370574951171875)) - _107[i];
        eye += (texture(_EyeTex, uvMapped) * step(distance(uv0, uvMapped), 1.0));
    }
    if (_OpacityEnable > 0.5)
    {
        float eyeOpacity = 0.0;
        for (mediump int i_1 = _LeftEyes; i_1 < _RightEyes; i_1++)
        {
            vec2 uvMapped_1 = (uv0 * vec2(7.650000095367431640625, 13.59999370574951171875)) - _107[i_1];
            eyeOpacity += (texture(_OpacityTex, uvMapped_1).x * step(distance(uv0, uvMapped_1), 1.0));
        }
        eye *= (_Color * eyeOpacity);
    }
    eye.w *= (mask * _Intensity);
    vec3 srcColor = clamp(background.xyz / vec3((step(0.0, -background.w) * 9.9999999747524270787835121154785e-07) + background.w), vec3(0.0), vec3(1.0));
    vec3 sucaiColor = clamp(eye.xyz / vec3((step(0.0, -eye.w) * 9.9999999747524270787835121154785e-07) + eye.w), vec3(0.0), vec3(1.0));
    vec3 param = srcColor;
    vec3 param_1 = sucaiColor;
    float param_2 = 1.0;
    vec3 result = mix(srcColor, ApplyBlendMode(param, param_1, param_2), vec3(eye.w));
    if (_ReflectionEnable > 0.5)
    {
        vec4 eyeReflection = vec4(0.0);
        for (mediump int i_2 = _LeftEyes; i_2 < _RightEyes; i_2++)
        {
            vec2 uvMapped_2 = (uv0 * vec2(7.650000095367431640625, 13.59999370574951171875)) - _107[i_2];
            eyeReflection += (texture(_ReflectionTex, uvMapped_2) * step(distance(uv0, uvMapped_2), 1.0));
        }
        eyeReflection *= (mask * _ReflectionIntensity);
        vec3 reflectColor = clamp(eyeReflection.xyz / vec3((step(0.0, -eyeReflection.w) * 9.9999999747524270787835121154785e-07) + eyeReflection.w), vec3(0.0), vec3(1.0));
        vec3 param_3 = result;
        vec3 param_4 = reflectColor;
        float param_5 = 1.0;
        result = mix(result, ApplyReflectBlendMode(param_3, param_4, param_5), vec3(eyeReflection.w));
    }
    o_FragColor = vec4(result, 1.0);
}

