#pragma clang diagnostic ignored "-Wmissing-prototypes"

#include <metal_stdlib>
#include <simd/simd.h>

using namespace metal;

struct buffer_t
{
    float4 u_color;
    float u_opacity;
};

struct main0_out
{
    float4 o_fragColor [[color(0)]];
};

struct main0_in
{
    float2 v_texCoord;
};

static inline __attribute__((always_inline))
float4 getBaseColor(thread float2& v_texCoord, texture2d<float> _MainTex, sampler _MainTexSmplr)
{
    float2 uv = v_texCoord;
    float4 texColor = _MainTex.sample(_MainTexSmplr, uv);
    return texColor;
}

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> _MainTex [[texture(0)]], sampler _MainTexSmplr [[sampler(0)]])
{
    main0_out out = {};
    float4 baseColor = getBaseColor(in.v_texCoord, _MainTex, _MainTexSmplr);
    float4 imageColor = (baseColor * buffer.u_color) * buffer.u_opacity;
    out.o_fragColor = imageColor;
    return out;
}

