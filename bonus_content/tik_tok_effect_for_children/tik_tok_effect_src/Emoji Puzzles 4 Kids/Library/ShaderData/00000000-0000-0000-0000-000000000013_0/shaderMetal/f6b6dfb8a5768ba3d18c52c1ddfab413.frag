#include <metal_stdlib>
#include <simd/simd.h>

using namespace metal;

struct buffer_t
{
    float4 _TintColor;
    float u_Opacity;
};

struct main0_out
{
    float4 glResult [[color(0)]];
};

struct main0_in
{
    float2 g_vary_uv0;
    float4 v_sampling_pos;
};

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> _FacePaintTexture [[texture(0)]], sampler _FacePaintTextureSmplr [[sampler(0)]])
{
    main0_out out = {};
    float2 uv = in.g_vary_uv0;
    uv.y = 1.0 - uv.y;
    float2 sampling_uv = ((in.v_sampling_pos.xy / float2(in.v_sampling_pos.w)) * 0.5) + float2(0.5);
    float4 texColor = _FacePaintTexture.sample(_FacePaintTextureSmplr, uv) * buffer._TintColor;
    texColor.w *= buffer.u_Opacity;
    if (texColor.w == 0.0)
    {
        discard_fragment();
    }
    out.glResult = texColor;
    return out;
}

