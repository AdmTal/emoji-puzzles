#include <metal_stdlib>
#include <simd/simd.h>

using namespace metal;

struct buffer_t
{
    float radius;
};

struct main0_out
{
    float4 o_FragColor [[color(0)]];
};

struct main0_in
{
    float2 screenUV;
    float2 orgUV;
    float2 modelScale;
};

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> u_FBOTexture [[texture(0)]], sampler u_FBOTextureSmplr [[sampler(0)]])
{
    main0_out out = {};
    float4 finalColor = u_FBOTexture.sample(u_FBOTextureSmplr, in.screenUV);
    float2 intersection = normalize(in.orgUV) * buffer.radius;
    float2 intersectionOval = float2(intersection.x * in.modelScale.x, intersection.y * in.modelScale.y);
    float2 orgUVOval = float2(in.orgUV.x * in.modelScale.x, in.orgUV.y * in.modelScale.y);
    float2 tangentOval = float2(1.0);
    float sinTheta = 1.0;
    if ((isunordered(intersectionOval.y, 0.0) || intersectionOval.y != 0.0))
    {
        tangentOval = float2(1.0, (((-1.0) * pow(in.modelScale.y, 2.0)) * intersectionOval.x) / (pow(in.modelScale.x, 2.0) * intersectionOval.y));
        float3 a = normalize(float3(tangentOval, 0.0));
        float3 b = normalize(float3(orgUVOval, 0.0));
        sinTheta = length(cross(a, b));
    }
    if ((length(intersectionOval) - length(orgUVOval)) >= 0.0)
    {
        if ((length(orgUVOval - intersectionOval) * sinTheta) <= 0.20000000298023223876953125)
        {
            finalColor = mix(finalColor, float4(0.2980000078678131103515625, 0.5759999752044677734375, 0.913999974727630615234375, 0.5), float4(1.0));
        }
    }
    out.o_FragColor = finalColor;
    return out;
}

