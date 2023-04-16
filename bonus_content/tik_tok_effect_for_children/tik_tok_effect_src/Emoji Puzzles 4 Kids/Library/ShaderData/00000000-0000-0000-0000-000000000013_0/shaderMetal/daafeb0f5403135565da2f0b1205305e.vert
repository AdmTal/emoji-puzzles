#include <metal_stdlib>
#include <simd/simd.h>

using namespace metal;

struct buffer_t
{
    float4 _MeshRescale;
    float2 _TexRescale;
    float4x4 u_MVP;
    float4x4 u_TransposeInvModel;
};

struct main0_out
{
    float2 g_vary_uv0;
    float4 v_sampling_pos;
    float4 v_background_pos;
    float3 v_worldPos;
    float3 v_Normal;
    float4 gl_Position [[position]];
};

struct main0_in
{
    float3 attPosition [[attribute(0)]];
    float2 attTexcoord0 [[attribute(1)]];
    float3 attNormal [[attribute(2)]];
};

vertex main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer)
{
    main0_out out = {};
    float3 modelPostiton = in.attPosition;
    float4x4 rescaleMat = float4x4(float4(buffer._MeshRescale.x, 0.0, 0.0, 0.0), float4(0.0, buffer._MeshRescale.y, 0.0, 0.0), float4(0.0, 0.0, buffer._MeshRescale.z, 0.0), float4(0.0, 0.0, 0.0, 1.0));
    float4 homogeneous_modelPostiton = rescaleMat * float4(modelPostiton, 1.0);
    float4 homogeneous_pos = float4(in.attPosition, 1.0);
    homogeneous_pos = rescaleMat * homogeneous_pos;
    out.g_vary_uv0 = ((in.attTexcoord0 - float2(0.5)) * buffer._TexRescale) + float2(0.5);
    out.gl_Position = buffer.u_MVP * homogeneous_pos;
    out.v_worldPos = homogeneous_pos.xyz;
    out.v_Normal = float3x3(buffer.u_TransposeInvModel[0].xyz, buffer.u_TransposeInvModel[1].xyz, buffer.u_TransposeInvModel[2].xyz) * in.attNormal;
    out.v_sampling_pos = buffer.u_MVP * homogeneous_modelPostiton;
    out.v_background_pos = buffer.u_MVP * homogeneous_pos;
    out.gl_Position.z = (out.gl_Position.z + out.gl_Position.w) * 0.5;       // Adjust clip-space for Metal
    return out;
}

