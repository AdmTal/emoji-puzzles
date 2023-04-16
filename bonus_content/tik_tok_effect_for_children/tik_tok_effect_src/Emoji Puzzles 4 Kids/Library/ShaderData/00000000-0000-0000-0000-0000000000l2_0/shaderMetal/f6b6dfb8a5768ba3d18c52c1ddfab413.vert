#include <metal_stdlib>
#include <simd/simd.h>

using namespace metal;

struct buffer_t
{
    float4x4 u_MVP;
    float2 signFlag;
    float2 intensity;
    float radius;
    float4x4 u_Model;
};

struct main0_out
{
    float2 screenUV;
    float2 orgUV;
    float2 modelScale;
    float4 gl_Position [[position]];
};

struct main0_in
{
    float3 attPosition [[attribute(0)]];
};

vertex main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer)
{
    main0_out out = {};
    out.gl_Position = buffer.u_MVP * float4(in.attPosition, 1.0);
    float dist = length(in.attPosition.xy);
    float2 flag = sign(buffer.signFlag * in.attPosition.xy);
    flag = float2(1.0 - length(sign(buffer.signFlag))) + ((flag * (flag + float2(1.0))) * 0.5);
    float2 finalUV = in.attPosition.xy;
    if (buffer.intensity.x > 0.0)
    {
        float scale = (1.0 - buffer.intensity.x) + (buffer.intensity.x * smoothstep(0.0, 1.0, pow(dist / buffer.radius, 2.0)));
        finalUV.x *= (((scale - 1.0) * flag.x) + 1.0);
    }
    else
    {
        float scale_1 = (1.0 + buffer.intensity.x) - (buffer.intensity.x * smoothstep(-0.300000011920928955078125, 1.0, dist / buffer.radius));
        finalUV.x /= (((scale_1 - 1.0) * flag.x) + 1.0);
    }
    if (buffer.intensity.y > 0.0)
    {
        float scale_2 = (1.0 - buffer.intensity.y) + (buffer.intensity.y * smoothstep(0.0, 1.0, pow(dist / buffer.radius, 2.0)));
        finalUV.y *= (((scale_2 - 1.0) * flag.y) + 1.0);
    }
    else
    {
        float scale_3 = (1.0 + buffer.intensity.y) - (buffer.intensity.y * smoothstep(-0.300000011920928955078125, 1.0, dist / buffer.radius));
        finalUV.y /= (((scale_3 - 1.0) * flag.y) + 1.0);
    }
    float4 tmp = buffer.u_MVP * float4(finalUV.x, finalUV.y, 0.0, 1.0);
    out.screenUV = (float2(tmp.x / tmp.w, tmp.y / tmp.w) * 0.5) + float2(0.5);
    out.modelScale = float2(length(buffer.u_Model[0].xyz), length(buffer.u_Model[1].xyz));
    out.orgUV = in.attPosition.xy;
    out.gl_Position.z = (out.gl_Position.z + out.gl_Position.w) * 0.5;       // Adjust clip-space for Metal
    return out;
}

