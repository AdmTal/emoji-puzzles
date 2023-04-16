#include <metal_stdlib>
#include <simd/simd.h>

using namespace metal;

struct buffer_t
{
    float _Intensity;
};

struct main0_out
{
    float4 o_FragColor [[color(0)]];
};

struct main0_in
{
    float2 uv0;
};

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> u_FBOTexture [[texture(0)]], texture2d<float> _BaseTexture [[texture(1)]], sampler u_FBOTextureSmplr [[sampler(0)]], sampler _BaseTextureSmplr [[sampler(1)]])
{
    main0_out out = {};
    float4 color = u_FBOTexture.sample(u_FBOTextureSmplr, in.uv0);
    float blueColor = color.z * 63.0;
    float2 quad1;
    quad1.y = floor(floor(blueColor) / 8.0);
    quad1.x = floor(blueColor) - (quad1.y * 8.0);
    float2 texPos1;
    texPos1.x = ((quad1.x * 0.125) + 0.0009765625) + (0.123046875 * color.x);
    texPos1.y = ((quad1.y * 0.125) + 0.0009765625) + (0.123046875 * color.y);
    float4 newColor = _BaseTexture.sample(_BaseTextureSmplr, texPos1);
    color = mix(color, newColor, float4(buffer._Intensity));
    out.o_FragColor = color;
    return out;
}

