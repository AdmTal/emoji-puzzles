#pragma clang diagnostic ignored "-Wmissing-prototypes"
#pragma clang diagnostic ignored "-Wmissing-braces"

#include <metal_stdlib>
#include <simd/simd.h>

using namespace metal;

template<typename T, size_t Num>
struct spvUnsafeArray
{
    T elements[Num ? Num : 1];
    
    thread T& operator [] (size_t pos) thread
    {
        return elements[pos];
    }
    constexpr const thread T& operator [] (size_t pos) const thread
    {
        return elements[pos];
    }
    
    device T& operator [] (size_t pos) device
    {
        return elements[pos];
    }
    constexpr const device T& operator [] (size_t pos) const device
    {
        return elements[pos];
    }
    
    constexpr const constant T& operator [] (size_t pos) const constant
    {
        return elements[pos];
    }
    
    threadgroup T& operator [] (size_t pos) threadgroup
    {
        return elements[pos];
    }
    constexpr const threadgroup T& operator [] (size_t pos) const threadgroup
    {
        return elements[pos];
    }
};

struct buffer_t
{
    int _LeftEyes;
    int _RightEyes;
    float _OpacityEnable;
    float4 _Color;
    float _Intensity;
    float _ReflectionEnable;
    float _ReflectionIntensity;
};

constant spvUnsafeArray<float2, 10> _107 = spvUnsafeArray<float2, 10>({ float2(1.440000057220458984375, 1.2999999523162841796875), float2(1.440000057220458984375, 3.8599998950958251953125), float2(1.46000003814697265625, 6.570000171661376953125), float2(1.57700002193450927734375, 9.3500003814697265625), float2(1.53400003910064697265625, 11.8500003814697265625), float2(5.21000003814697265625, 1.35000002384185791015625), float2(5.27600002288818359375, 3.8599998950958251953125), float2(5.235000133514404296875, 6.5799999237060546875), float2(5.11999988555908203125, 9.3500003814697265625), float2(5.2189998626708984375, 11.89000034332275390625) });

struct main0_out
{
    float4 o_FragColor [[color(0)]];
};

struct main0_in
{
    float2 uv0;
};

static inline __attribute__((always_inline))
float3 ApplyBlendMode(thread const float3& base, thread const float3& blend, thread const float& opacity)
{
    float3 ret = blend;
    return ret;
}

static inline __attribute__((always_inline))
float3 ApplyReflectBlendMode(thread const float3& base, thread const float3& blend, thread const float& opacity)
{
    float3 ret = blend;
    return ret;
}

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> _MainTex [[texture(0)]], texture2d<float> _MaskTex [[texture(1)]], texture2d<float> _EyeTex [[texture(2)]], texture2d<float> _OpacityTex [[texture(3)]], texture2d<float> _ReflectionTex [[texture(4)]], sampler _MainTexSmplr [[sampler(0)]], sampler _MaskTexSmplr [[sampler(1)]], sampler _EyeTexSmplr [[sampler(2)]], sampler _OpacityTexSmplr [[sampler(3)]], sampler _ReflectionTexSmplr [[sampler(4)]])
{
    main0_out out = {};
    float4 background = _MainTex.sample(_MainTexSmplr, in.uv0);
    float mask = _MaskTex.sample(_MaskTexSmplr, in.uv0).x;
    float4 eye = float4(0.0);
    for (int i = buffer._LeftEyes; i < buffer._RightEyes; i++)
    {
        float2 uvMapped = (in.uv0 * float2(7.650000095367431640625, 13.59999370574951171875)) - _107[i];
        eye += (_EyeTex.sample(_EyeTexSmplr, uvMapped) * step(distance(in.uv0, uvMapped), 1.0));
    }
    if (buffer._OpacityEnable > 0.5)
    {
        float eyeOpacity = 0.0;
        for (int i_1 = buffer._LeftEyes; i_1 < buffer._RightEyes; i_1++)
        {
            float2 uvMapped_1 = (in.uv0 * float2(7.650000095367431640625, 13.59999370574951171875)) - _107[i_1];
            eyeOpacity += (_OpacityTex.sample(_OpacityTexSmplr, uvMapped_1).x * step(distance(in.uv0, uvMapped_1), 1.0));
        }
        eye *= (buffer._Color * eyeOpacity);
    }
    eye.w *= (mask * buffer._Intensity);
    float3 srcColor = fast::clamp(background.xyz / float3((step(0.0, -background.w) * 9.9999999747524270787835121154785e-07) + background.w), float3(0.0), float3(1.0));
    float3 sucaiColor = fast::clamp(eye.xyz / float3((step(0.0, -eye.w) * 9.9999999747524270787835121154785e-07) + eye.w), float3(0.0), float3(1.0));
    float3 param = srcColor;
    float3 param_1 = sucaiColor;
    float param_2 = 1.0;
    float3 result = mix(srcColor, ApplyBlendMode(param, param_1, param_2), float3(eye.w));
    if (buffer._ReflectionEnable > 0.5)
    {
        float4 eyeReflection = float4(0.0);
        for (int i_2 = buffer._LeftEyes; i_2 < buffer._RightEyes; i_2++)
        {
            float2 uvMapped_2 = (in.uv0 * float2(7.650000095367431640625, 13.59999370574951171875)) - _107[i_2];
            eyeReflection += (_ReflectionTex.sample(_ReflectionTexSmplr, uvMapped_2) * step(distance(in.uv0, uvMapped_2), 1.0));
        }
        eyeReflection *= (mask * buffer._ReflectionIntensity);
        float3 reflectColor = fast::clamp(eyeReflection.xyz / float3((step(0.0, -eyeReflection.w) * 9.9999999747524270787835121154785e-07) + eyeReflection.w), float3(0.0), float3(1.0));
        float3 param_3 = result;
        float3 param_4 = reflectColor;
        float param_5 = 1.0;
        result = mix(result, ApplyReflectBlendMode(param_3, param_4, param_5), float3(eyeReflection.w));
    }
    out.o_FragColor = float4(result, 1.0);
    return out;
}

