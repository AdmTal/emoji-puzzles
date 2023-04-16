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

struct SurfaceParams
{
    float3 albedo;
    float opacity;
    float cutoff;
    float3 emissive;
    float2 metalParams;
    float3 roughParams;
    float3 clearCoatRoughParams;
    float2 occParams;
    float3 diffCol;
    float3 specCol;
    float2 anisoParams;
    float thin;
    float subsurface;
    float3 subsurfaceColMultiply;
    float3 subsurfaceCol;
    float ior;
    float transmittance;
    float transmittanceColorAtDistance;
    float clearCoat;
    float3 pos;
    float3 nDir;
    float3 vnDir;
    float3 cnDir;
    float3 tDir;
    float3 bDir;
    float3 vDir;
    float3 rDir;
    float3 crDir;
};

struct LightParams
{
    float enable;
    float3 lDir;
    float3 color;
    float intensity;
    float3 attenuate;
};

struct EnvironmentParams
{
    float intensity;
    float rotation;
};

struct VSOutput
{
    float3 posWS;
    float3 nDirWS;
    float3 tDirWS;
    float3 bDirWS;
};

struct LightGroupParams
{
    spvUnsafeArray<LightParams, 3> DirLights;
    spvUnsafeArray<LightParams, 2> PointLights;
    spvUnsafeArray<LightParams, 2> SpotLights;
    float dummy;
};

struct buffer_t
{
    float4 u_WorldSpaceCameraPos;
    spvUnsafeArray<float, 3> u_DirLightsEnabled;
    float u_DirLightNum;
    spvUnsafeArray<float4, 3> u_DirLightsDirection;
    spvUnsafeArray<float4, 3> u_DirLightsColor;
    spvUnsafeArray<float, 3> u_DirLightsIntensity;
    spvUnsafeArray<float, 2> u_PointLightsEnabled;
    float u_PointLightNum;
    spvUnsafeArray<float4, 2> u_PointLightsPosition;
    spvUnsafeArray<float4, 2> u_PointLightsColor;
    spvUnsafeArray<float, 2> u_PointLightsIntensity;
    spvUnsafeArray<float, 2> u_PointLightsAttenRangeInv;
    spvUnsafeArray<float, 2> u_SpotLightsEnabled;
    float u_SpotLightNum;
    spvUnsafeArray<float4, 2> u_SpotLightsPosition;
    spvUnsafeArray<float4, 2> u_SpotLightsColor;
    spvUnsafeArray<float, 2> u_SpotLightsIntensity;
    spvUnsafeArray<float, 2> u_SpotLightsAttenRangeInv;
    spvUnsafeArray<float4, 2> u_SpotLightsDirection;
    spvUnsafeArray<float, 2> u_SpotLightsOuterAngleCos;
    spvUnsafeArray<float, 2> u_SpotLightsInnerAngleCos;
    float _AmbientIntensity;
    float _AmbientRotation;
    float4 _AlbedoColor;
    float _Metallic;
    float _Roughness;
};

struct main0_out
{
    float4 glResult [[color(0)]];
};

struct main0_in
{
    float3 v_posWS;
    float3 v_nDirWS;
    float2 v_uv0;
    float4 v_gl_pos;
    float3 v_tDirWS;
    float3 v_bDirWS;
};

static inline __attribute__((always_inline))
float3 GammaToLinear(thread const float3& col)
{
    return float3(pow(col.x, 2.2000000476837158203125), pow(col.y, 2.2000000476837158203125), pow(col.z, 2.2000000476837158203125));
}

static inline __attribute__((always_inline))
VSOutput BuildVSOutput(thread float3& v_posWS, thread float3& v_nDirWS, thread float3& v_tDirWS, thread float3& v_bDirWS)
{
    VSOutput V;
    V.posWS = v_posWS;
    V.nDirWS = normalize(v_nDirWS);
    V.tDirWS = normalize(v_tDirWS);
    V.bDirWS = normalize(v_bDirWS);
    return V;
}

static inline __attribute__((always_inline))
float saturate0(thread const float& x)
{
    return fast::clamp(x, 0.0, 1.0);
}

static inline __attribute__((always_inline))
float Pow2(thread const float& x)
{
    return x * x;
}

static inline __attribute__((always_inline))
float SpecularAO(thread const SurfaceParams& S)
{
    float ndv = fast::max(0.0, dot(S.nDir, S.vDir));
    float visibility = S.occParams.x;
    float perceptualRoughness = S.roughParams.x;
    float param = (pow(ndv + visibility, exp2(((-16.0) * perceptualRoughness) - 1.0)) - 1.0) + visibility;
    float lagardeAO = saturate0(param);
    float horizon = fast::min(1.0 + dot(S.rDir, S.nDir), 1.0);
    float horizonAO = horizon * horizon;
    return lagardeAO * horizonAO;
}

static inline __attribute__((always_inline))
SurfaceParams BuildSurfaceParams(thread const VSOutput& V, thread const float& envInt, thread const float& envRot, thread const float3& albedo, thread const float& opacity, thread const float& cutoff, thread const float3& normal, thread const float3& clearCoatNormal, thread const float& metallic, thread const float& roughness, thread const float& ao, thread const float& subsurface, thread const float3& subsurfaceCol, thread const float3& subsurfaceColMultiply, thread const float& ior, thread const float& transmittance, thread const float& transmittanceColorAtDistance, thread const float& thin, thread const float& clearCoat, thread const float& clearCoatRoughness, thread const float3& emissive, thread const float& anisotropic, thread const float& anisotropicRotate, thread const float& rampID, thread const float& rim, thread const float3& rimCol, thread const float3& ambient, thread const float3& matcap, thread const float& smoothFactor, constant float4& u_WorldSpaceCameraPos)
{
    SurfaceParams S;
    S.albedo = albedo;
    S.opacity = opacity;
    float param = metallic;
    S.metalParams.x = saturate0(param);
    S.metalParams.y = 0.959999978542327880859375 * (1.0 - S.metalParams.x);
    S.roughParams.x = fast::clamp(roughness, 0.07999999821186065673828125, 1.0);
    float param_1 = S.roughParams.x;
    S.roughParams.y = Pow2(param_1);
    float param_2 = S.roughParams.y;
    S.roughParams.z = Pow2(param_2);
    float param_3 = ao;
    S.occParams.x = saturate0(param_3);
    float param_4 = thin;
    S.thin = saturate0(param_4);
    S.clearCoat = clearCoat;
    S.emissive = emissive;
    S.diffCol = S.albedo * S.metalParams.y;
    S.specCol = mix(float3(0.039999999105930328369140625), S.albedo, float3(S.metalParams.x));
    S.subsurface = subsurface;
    S.subsurfaceColMultiply = subsurfaceColMultiply;
    S.subsurfaceCol = subsurfaceCol;
    S.ior = ior;
    S.transmittance = transmittance;
    S.transmittanceColorAtDistance = transmittanceColorAtDistance;
    S.pos = V.posWS;
    S.vnDir = V.nDirWS;
    S.nDir = normal;
    S.cnDir = clearCoatNormal;
    S.tDir = V.tDirWS;
    S.bDir = V.bDirWS;
    S.vDir = normalize(u_WorldSpaceCameraPos.xyz - V.posWS);
    float3 _1445;
    if (dot(S.vDir, S.nDir) < 0.0)
    {
        _1445 = reflect(S.vDir, S.nDir);
    }
    else
    {
        _1445 = S.vDir;
    }
    S.vDir = _1445;
    S.rDir = normalize(reflect(-S.vDir, S.nDir));
    SurfaceParams param_5 = S;
    S.occParams.y = SpecularAO(param_5);
    return S;
}

static inline __attribute__((always_inline))
EnvironmentParams BuildEnvironmentParams(thread const float& envInt, thread const float& envRot)
{
    EnvironmentParams E;
    E.intensity = envInt;
    E.rotation = envRot;
    return E;
}

static inline __attribute__((always_inline))
LightParams BuildDirLightParams(thread const SurfaceParams& S, thread const int& index, constant spvUnsafeArray<float, 3>& u_DirLightsEnabled, constant float& u_DirLightNum, constant spvUnsafeArray<float4, 3>& u_DirLightsDirection, constant spvUnsafeArray<float4, 3>& u_DirLightsColor, constant spvUnsafeArray<float, 3>& u_DirLightsIntensity)
{
    LightParams ML;
    ML.enable = u_DirLightsEnabled[index] * step(float(index) + 0.5, u_DirLightNum);
    ML.lDir = normalize(-u_DirLightsDirection[index].xyz);
    ML.color = u_DirLightsColor[index].xyz;
    ML.intensity = u_DirLightsIntensity[index] * ML.enable;
    ML.attenuate = float3(1.0);
    return ML;
}

static inline __attribute__((always_inline))
float Pow4(thread const float& x)
{
    float x2 = x * x;
    return x2 * x2;
}

static inline __attribute__((always_inline))
LightParams BuildPointLightParams(thread const SurfaceParams& S, thread const int& index, constant spvUnsafeArray<float, 2>& u_PointLightsEnabled, constant float& u_PointLightNum, constant spvUnsafeArray<float4, 2>& u_PointLightsPosition, constant spvUnsafeArray<float4, 2>& u_PointLightsColor, constant spvUnsafeArray<float, 2>& u_PointLightsIntensity, constant spvUnsafeArray<float, 2>& u_PointLightsAttenRangeInv)
{
    float3 lVec = float3(0.0);
    float lDist = 0.0;
    LightParams PL1;
    PL1.enable = u_PointLightsEnabled[index] * step(float(index) + 0.5, u_PointLightNum);
    lVec = u_PointLightsPosition[index].xyz - S.pos;
    lDist = length(lVec);
    PL1.lDir = lVec / float3(lDist);
    PL1.color = u_PointLightsColor[index].xyz;
    PL1.intensity = u_PointLightsIntensity[index] * PL1.enable;
    lDist *= u_PointLightsAttenRangeInv[index];
    float param = lDist;
    float param_1 = 1.0 - Pow4(param);
    float param_2 = saturate0(param_1);
    float param_3 = lDist;
    float attenuate = (Pow2(param_2) * (Pow2(param_3) + 1.0)) * 0.25;
    PL1.attenuate = float3(attenuate, attenuate, attenuate);
    return PL1;
}

static inline __attribute__((always_inline))
LightParams BuildSpotLightParams(thread const SurfaceParams& S, thread const int& index, constant spvUnsafeArray<float, 2>& u_SpotLightsEnabled, constant float& u_SpotLightNum, constant spvUnsafeArray<float4, 2>& u_SpotLightsPosition, constant spvUnsafeArray<float4, 2>& u_SpotLightsColor, constant spvUnsafeArray<float, 2>& u_SpotLightsIntensity, constant spvUnsafeArray<float, 2>& u_SpotLightsAttenRangeInv, constant spvUnsafeArray<float4, 2>& u_SpotLightsDirection, constant spvUnsafeArray<float, 2>& u_SpotLightsOuterAngleCos, constant spvUnsafeArray<float, 2>& u_SpotLightsInnerAngleCos)
{
    float3 lVec = float3(0.0);
    float lDist = 0.0;
    float3 spotDir = float3(0.0);
    float angleAtten = 0.0;
    LightParams SL1;
    SL1.enable = u_SpotLightsEnabled[index] * step(float(index) + 0.5, u_SpotLightNum);
    lVec = u_SpotLightsPosition[index].xyz - S.pos;
    lDist = length(lVec);
    SL1.lDir = lVec / float3(lDist);
    SL1.color = u_SpotLightsColor[index].xyz;
    SL1.intensity = u_SpotLightsIntensity[index] * SL1.enable;
    lDist *= u_SpotLightsAttenRangeInv[index];
    float param = lDist;
    float param_1 = 1.0 - Pow4(param);
    float param_2 = saturate0(param_1);
    float param_3 = lDist;
    float attenuate = (Pow2(param_2) * (Pow2(param_3) + 1.0)) * 0.25;
    spotDir = normalize(-u_SpotLightsDirection[index].xyz);
    angleAtten = fast::max(0.0, dot(SL1.lDir, spotDir));
    attenuate *= smoothstep(u_SpotLightsOuterAngleCos[index], u_SpotLightsInnerAngleCos[index], angleAtten);
    SL1.attenuate = float3(attenuate, attenuate, attenuate);
    return SL1;
}

static inline __attribute__((always_inline))
LightGroupParams BuildLightGroupParams(thread const SurfaceParams& S, constant spvUnsafeArray<float, 3>& u_DirLightsEnabled, constant float& u_DirLightNum, constant spvUnsafeArray<float4, 3>& u_DirLightsDirection, constant spvUnsafeArray<float4, 3>& u_DirLightsColor, constant spvUnsafeArray<float, 3>& u_DirLightsIntensity, constant spvUnsafeArray<float, 2>& u_PointLightsEnabled, constant float& u_PointLightNum, constant spvUnsafeArray<float4, 2>& u_PointLightsPosition, constant spvUnsafeArray<float4, 2>& u_PointLightsColor, constant spvUnsafeArray<float, 2>& u_PointLightsIntensity, constant spvUnsafeArray<float, 2>& u_PointLightsAttenRangeInv, constant spvUnsafeArray<float, 2>& u_SpotLightsEnabled, constant float& u_SpotLightNum, constant spvUnsafeArray<float4, 2>& u_SpotLightsPosition, constant spvUnsafeArray<float4, 2>& u_SpotLightsColor, constant spvUnsafeArray<float, 2>& u_SpotLightsIntensity, constant spvUnsafeArray<float, 2>& u_SpotLightsAttenRangeInv, constant spvUnsafeArray<float4, 2>& u_SpotLightsDirection, constant spvUnsafeArray<float, 2>& u_SpotLightsOuterAngleCos, constant spvUnsafeArray<float, 2>& u_SpotLightsInnerAngleCos)
{
    LightGroupParams LG;
    LG.dummy = 0.0;
    SurfaceParams param = S;
    int param_1 = 0;
    LG.DirLights[0] = BuildDirLightParams(param, param_1, u_DirLightsEnabled, u_DirLightNum, u_DirLightsDirection, u_DirLightsColor, u_DirLightsIntensity);
    SurfaceParams param_2 = S;
    int param_3 = 1;
    LG.DirLights[1] = BuildDirLightParams(param_2, param_3, u_DirLightsEnabled, u_DirLightNum, u_DirLightsDirection, u_DirLightsColor, u_DirLightsIntensity);
    SurfaceParams param_4 = S;
    int param_5 = 2;
    LG.DirLights[2] = BuildDirLightParams(param_4, param_5, u_DirLightsEnabled, u_DirLightNum, u_DirLightsDirection, u_DirLightsColor, u_DirLightsIntensity);
    SurfaceParams param_6 = S;
    int param_7 = 0;
    LG.PointLights[0] = BuildPointLightParams(param_6, param_7, u_PointLightsEnabled, u_PointLightNum, u_PointLightsPosition, u_PointLightsColor, u_PointLightsIntensity, u_PointLightsAttenRangeInv);
    SurfaceParams param_8 = S;
    int param_9 = 1;
    LG.PointLights[1] = BuildPointLightParams(param_8, param_9, u_PointLightsEnabled, u_PointLightNum, u_PointLightsPosition, u_PointLightsColor, u_PointLightsIntensity, u_PointLightsAttenRangeInv);
    SurfaceParams param_10 = S;
    int param_11 = 0;
    LG.SpotLights[0] = BuildSpotLightParams(param_10, param_11, u_SpotLightsEnabled, u_SpotLightNum, u_SpotLightsPosition, u_SpotLightsColor, u_SpotLightsIntensity, u_SpotLightsAttenRangeInv, u_SpotLightsDirection, u_SpotLightsOuterAngleCos, u_SpotLightsInnerAngleCos);
    SurfaceParams param_12 = S;
    int param_13 = 1;
    LG.SpotLights[1] = BuildSpotLightParams(param_12, param_13, u_SpotLightsEnabled, u_SpotLightNum, u_SpotLightsPosition, u_SpotLightsColor, u_SpotLightsIntensity, u_SpotLightsAttenRangeInv, u_SpotLightsDirection, u_SpotLightsOuterAngleCos, u_SpotLightsInnerAngleCos);
    return LG;
}

static inline __attribute__((always_inline))
float Atan2(thread const float& x, thread const float& y)
{
    float signx = (x < 0.0) ? (-1.0) : 1.0;
    return signx * acos(fast::clamp(y / length(float2(x, y)), -1.0, 1.0));
}

static inline __attribute__((always_inline))
float2 GetPanoramicTexCoordsFromDir(thread float3& dir, thread const float& rotation)
{
    dir = normalize(dir);
    float param = dir.x;
    float param_1 = -dir.z;
    float2 uv;
    uv.x = (Atan2(param, param_1) - 1.57079637050628662109375) / 6.283185482025146484375;
    uv.y = acos(dir.y) / 3.1415927410125732421875;
    uv.x += rotation;
    uv.x = fract((uv.x + floor(uv.x)) + 1.0);
    return uv;
}

static inline __attribute__((always_inline))
float3 SamplerEncodedPanoramicWithUV(thread const texture2d<float> panoramic, thread const sampler panoramicSmplr, thread const float2& uv, thread const float& lod)
{
    float lodMin = floor(lod);
    float lodLerp = lod - lodMin;
    float2 uvLodMin = uv;
    float2 uvLodMax = uv;
    float2 size = float2(0.0);
    if (abs(lodMin - 0.0) < 0.001000000047497451305389404296875)
    {
        uvLodMin.x = ((((uv.x * 511.0) / 512.0) + 0.0009765625) * 1.0) + 0.0;
        uvLodMin.y = ((((uv.y * 255.0) / 256.0) + 0.001953125) * 0.5) + 0.0;
        uvLodMax.x = ((((uv.x * 255.0) / 256.0) + 0.001953125) * 0.5) + 0.0;
        uvLodMax.y = ((((uv.y * 127.0) / 128.0) + 0.00390625) * 0.25) + 0.5;
    }
    else
    {
        if (abs(lodMin - 1.0) < 0.001000000047497451305389404296875)
        {
            uvLodMin.x = ((((uv.x * 255.0) / 256.0) + 0.001953125) * 0.5) + 0.0;
            uvLodMin.y = ((((uv.y * 127.0) / 128.0) + 0.00390625) * 0.25) + 0.5;
            uvLodMax.x = ((((uv.x * 255.0) / 256.0) + 0.001953125) * 0.5) + 0.5;
            uvLodMax.y = ((((uv.y * 127.0) / 128.0) + 0.00390625) * 0.25) + 0.5;
        }
        else
        {
            if (abs(lodMin - 2.0) < 0.001000000047497451305389404296875)
            {
                uvLodMin.x = ((((uv.x * 255.0) / 256.0) + 0.001953125) * 0.5) + 0.5;
                uvLodMin.y = ((((uv.y * 127.0) / 128.0) + 0.00390625) * 0.25) + 0.5;
                uvLodMax.x = ((((uv.x * 255.0) / 256.0) + 0.001953125) * 0.5) + 0.0;
                uvLodMax.y = ((((uv.y * 127.0) / 128.0) + 0.00390625) * 0.25) + 0.75;
            }
            else
            {
                if (abs(lodMin - 3.0) < 0.001000000047497451305389404296875)
                {
                    uvLodMin.x = ((((uv.x * 255.0) / 256.0) + 0.001953125) * 0.5) + 0.0;
                    uvLodMin.y = ((((uv.y * 127.0) / 128.0) + 0.00390625) * 0.25) + 0.75;
                    uvLodMax.x = ((((uv.x * 127.0) / 128.0) + 0.00390625) * 0.25) + 0.5;
                    uvLodMax.y = ((((uv.y * 63.0) / 64.0) + 0.0078125) * 0.125) + 0.75;
                }
                else
                {
                    if (abs(lodMin - 4.0) < 0.001000000047497451305389404296875)
                    {
                        uvLodMin.x = ((((uv.x * 127.0) / 128.0) + 0.00390625) * 0.25) + 0.5;
                        uvLodMin.y = ((((uv.y * 63.0) / 64.0) + 0.0078125) * 0.125) + 0.75;
                        uvLodMax.x = ((((uv.x * 127.0) / 128.0) + 0.00390625) * 0.25) + 0.75;
                        uvLodMax.y = ((((uv.y * 63.0) / 64.0) + 0.0078125) * 0.125) + 0.75;
                    }
                    else
                    {
                        if (abs(lodMin - 5.0) < 0.001000000047497451305389404296875)
                        {
                            uvLodMin.x = ((((uv.x * 127.0) / 128.0) + 0.00390625) * 0.25) + 0.75;
                            uvLodMin.y = ((((uv.y * 63.0) / 64.0) + 0.0078125) * 0.125) + 0.75;
                            uvLodMax.x = ((((uv.x * 127.0) / 128.0) + 0.00390625) * 0.25) + 0.5;
                            uvLodMax.y = ((((uv.y * 63.0) / 64.0) + 0.0078125) * 0.125) + 0.875;
                        }
                        else
                        {
                            if (abs(lodMin - 6.0) < 0.001000000047497451305389404296875)
                            {
                                uvLodMin.x = ((((uv.x * 127.0) / 128.0) + 0.00390625) * 0.25) + 0.5;
                                uvLodMin.y = ((((uv.y * 63.0) / 64.0) + 0.0078125) * 0.125) + 0.875;
                                uvLodMax.x = ((((uv.x * 127.0) / 128.0) + 0.00390625) * 0.25) + 0.75;
                                uvLodMax.y = ((((uv.y * 63.0) / 64.0) + 0.0078125) * 0.125) + 0.875;
                            }
                            else
                            {
                                if (abs(lodMin - 7.0) < 0.001000000047497451305389404296875)
                                {
                                    uvLodMin.x = ((((uv.x * 127.0) / 128.0) + 0.00390625) * 0.25) + 0.75;
                                    uvLodMin.y = ((((uv.y * 63.0) / 64.0) + 0.0078125) * 0.125) + 0.875;
                                    uvLodMax.x = ((((uv.x * 127.0) / 128.0) + 0.00390625) * 0.25) + 0.75;
                                    uvLodMax.y = ((((uv.y * 63.0) / 64.0) + 0.0078125) * 0.125) + 0.875;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    float4 envEncoded = mix(panoramic.sample(panoramicSmplr, uvLodMin), panoramic.sample(panoramicSmplr, uvLodMax), float4(lodLerp));
    return envEncoded.xyz / float3(envEncoded.w);
}

static inline __attribute__((always_inline))
float3 SamplerEncodedPanoramic(thread const texture2d<float> panoramic, thread const sampler panoramicSmplr, thread const float3& dir, thread const float& rotation, thread const float& lod)
{
    float3 param = dir;
    float param_1 = rotation;
    float2 _1230 = GetPanoramicTexCoordsFromDir(param, param_1);
    float2 uv = _1230;
    float2 param_2 = uv;
    float param_3 = lod;
    return SamplerEncodedPanoramicWithUV(panoramic, panoramicSmplr, param_2, param_3);
}

static inline __attribute__((always_inline))
float3 GTAO_MultiBounce(thread const float& visibility, thread const float3& albedo)
{
    float3 a = (albedo * 2.040400028228759765625) - float3(0.3323999941349029541015625);
    float3 b = (albedo * (-4.79510021209716796875)) + float3(0.6417000293731689453125);
    float3 c = (albedo * 2.755199909210205078125) + float3(0.69029998779296875);
    return fast::max(float3(visibility), ((((a * visibility) + b) * visibility) + c) * visibility);
}

static inline __attribute__((always_inline))
float3 Diffuse_Panoramic(thread const SurfaceParams& S, thread const EnvironmentParams& E, thread const texture2d<float> envTex, thread const sampler envTexSmplr)
{
    float3 param = S.nDir;
    float param_1 = E.rotation;
    float param_2 = 7.0;
    float3 lighting = SamplerEncodedPanoramic(envTex, envTexSmplr, param, param_1, param_2);
    float param_3 = S.occParams.x;
    float3 param_4 = S.diffCol;
    float3 multiBounceColor = GTAO_MultiBounce(param_3, param_4);
    return ((lighting * S.diffCol) * multiBounceColor) * E.intensity;
}

static inline __attribute__((always_inline))
float3 EnvBRDFApprox(thread const SurfaceParams& S)
{
    float ndv = fast::max(0.0, dot(S.nDir, S.vDir));
    float perceptualRoughness = S.roughParams.x;
    float4 r = (float4(-1.0, -0.0274999998509883880615234375, -0.572000026702880859375, 0.02199999988079071044921875) * perceptualRoughness) + float4(1.0, 0.0425000004470348358154296875, 1.03999996185302734375, -0.039999999105930328369140625);
    float a004 = (fast::min(r.x * r.x, exp2((-9.27999973297119140625) * ndv)) * r.x) + r.y;
    float2 AB = (float2(-1.03999996185302734375, 1.03999996185302734375) * a004) + r.zw;
    float param = 50.0 * S.specCol.y;
    AB.y *= saturate0(param);
    return (S.specCol * AB.x) + float3(AB.y);
}

static inline __attribute__((always_inline))
float3 Specular_Panoramic(thread const SurfaceParams& S, thread const EnvironmentParams& E, thread const texture2d<float> envTex, thread const sampler envTexSmplr)
{
    float3 dir = mix(S.rDir, S.nDir, float3(S.roughParams.x * S.roughParams.y));
    float3 param = dir;
    float param_1 = E.rotation;
    float param_2 = (S.roughParams.x - 0.07999999821186065673828125) * 7.0;
    float3 specEnv = SamplerEncodedPanoramic(envTex, envTexSmplr, param, param_1, param_2);
    SurfaceParams param_3 = S;
    float3 brdf = EnvBRDFApprox(param_3);
    float param_4 = S.occParams.y;
    float3 param_5 = S.specCol;
    float3 multiBounceColor = GTAO_MultiBounce(param_4, param_5);
    return ((brdf * specEnv) * multiBounceColor) * E.intensity;
}

static inline __attribute__((always_inline))
float3 Diffuse_OrenNayar(thread const SurfaceParams& S, thread const LightParams& L)
{
    float3 hDir = normalize(L.lDir + S.vDir);
    float ndl = fast::max(0.0, dot(S.nDir, L.lDir));
    float ndv = fast::max(0.0, dot(S.nDir, S.vDir));
    float vdh = fast::max(0.0, dot(S.vDir, hDir));
    float a = S.roughParams.y;
    float s = a;
    float s2 = s * s;
    float VoL = ((2.0 * vdh) * vdh) - 1.0;
    float Cosri = VoL - (ndv * ndl);
    float C1 = 1.0 - ((0.5 * s2) / (s2 + 0.3300000131130218505859375));
    float _422;
    if (Cosri >= 0.0)
    {
        _422 = 1.0 / fast::max(ndl, ndv);
    }
    else
    {
        _422 = 1.0;
    }
    float C2 = (((0.449999988079071044921875 * s2) / (s2 + 0.0900000035762786865234375)) * Cosri) * _422;
    float lighting = ((C1 + C2) * (1.0 + (S.roughParams.x * 0.5))) * ndl;
    return (((S.diffCol * L.color) * L.intensity) * L.attenuate) * lighting;
}

static inline __attribute__((always_inline))
float V_SmithJointApprox(thread const float& a, thread const float& ndv, thread const float& ndl)
{
    float lambdaV = ndl * ((ndv * (1.0 - a)) + a);
    float lambdaL = ndv * ((ndl * (1.0 - a)) + a);
    return 0.5 / ((lambdaV + lambdaL) + 9.9999997473787516355514526367188e-06);
}

static inline __attribute__((always_inline))
float D_GGX(thread const float& ndh, thread const float& a2)
{
    float d = (((ndh * a2) - ndh) * ndh) + 1.0;
    return (a2 * 0.31830990314483642578125) / ((d * d) + 1.0000000116860974230803549289703e-07);
}

static inline __attribute__((always_inline))
float Pow5(thread const float& x)
{
    float x2 = x * x;
    return (x2 * x2) * x;
}

static inline __attribute__((always_inline))
float3 F_Schlick(thread const float3& f0, thread const float& vdh)
{
    float param = 1.0 - vdh;
    float t = Pow5(param);
    return f0 + ((float3(1.0) - f0) * t);
}

static inline __attribute__((always_inline))
float3 Specular_GGX(thread const SurfaceParams& S, thread const LightParams& L)
{
    float3 hDir = normalize(L.lDir + S.vDir);
    float ndh = fast::max(0.0, dot(S.nDir, hDir));
    float vdh = fast::max(0.0, dot(S.vDir, hDir));
    float ndl = fast::max(0.0, dot(S.nDir, L.lDir));
    float ndv = fast::max(0.0, dot(S.nDir, S.vDir));
    float a = S.roughParams.y;
    float a2 = S.roughParams.z;
    float param = ndl;
    float param_1 = ndv;
    float param_2 = a;
    float V = V_SmithJointApprox(param, param_1, param_2);
    float param_3 = ndh;
    float param_4 = a2;
    float D = D_GGX(param_3, param_4);
    float3 param_5 = S.specCol;
    float param_6 = vdh;
    float3 F = F_Schlick(param_5, param_6);
    float3 specular = ((((((F * V) * D) * 3.1415927410125732421875) * ndl) * L.color) * L.intensity) * L.attenuate;
    return specular;
}

static inline __attribute__((always_inline))
float3 Diffuse_Lambert(thread const SurfaceParams& S, thread const LightParams& L)
{
    float ndl = fast::max(0.0, dot(S.nDir, L.lDir));
    float lighting = ndl;
    return (((S.diffCol * L.color) * L.intensity) * L.attenuate) * lighting;
}

static inline __attribute__((always_inline))
float V_Const()
{
    return 0.25;
}

static inline __attribute__((always_inline))
float3 Specular_GGX_Low(thread const SurfaceParams& S, thread const LightParams& L)
{
    float3 hDir = normalize(L.lDir + S.vDir);
    float ndh = fast::max(0.0, dot(S.nDir, hDir));
    float vdh = fast::max(0.0, dot(S.vDir, hDir));
    float ndl = fast::max(0.0, dot(S.nDir, L.lDir));
    float a = S.roughParams.y;
    float a2 = S.roughParams.z;
    float V = V_Const();
    float param = ndh;
    float param_1 = a2;
    float D = D_GGX(param, param_1);
    float3 param_2 = S.specCol;
    float param_3 = vdh;
    float3 F = F_Schlick(param_2, param_3);
    float3 specular = ((((((F * V) * D) * 3.1415927410125732421875) * ndl) * L.color) * L.intensity) * L.attenuate;
    return specular;
}

static inline __attribute__((always_inline))
float3 Lighting(thread const VSOutput& V, thread const SurfaceParams& S, thread const EnvironmentParams& E, thread const texture2d<float> envTex, thread const sampler envTexSmplr, thread const LightGroupParams& LG)
{
    float3 Fd = float3(0.0);
    float3 Fr = float3(0.0);
    float coatAttenuate_IBL = 1.0;
    SurfaceParams param = S;
    EnvironmentParams param_1 = E;
    Fd += (Diffuse_Panoramic(param, param_1, envTex, envTexSmplr) * coatAttenuate_IBL);
    SurfaceParams param_2 = S;
    EnvironmentParams param_3 = E;
    Fr += (Specular_Panoramic(param_2, param_3, envTex, envTexSmplr) * coatAttenuate_IBL);
    LightParams ML = LG.DirLights[0];
    if (ML.enable > 0.5)
    {
        float coatAttenuate_ML = 1.0;
        SurfaceParams param_4 = S;
        LightParams param_5 = ML;
        Fd += (Diffuse_OrenNayar(param_4, param_5) * coatAttenuate_ML);
        SurfaceParams param_6 = S;
        LightParams param_7 = ML;
        Fr += (Specular_GGX(param_6, param_7) * coatAttenuate_ML);
    }
    LightParams DL = LG.DirLights[1];
    if (DL.enable > 0.5)
    {
        float coatAttenuate_DL = 1.0;
        SurfaceParams param_8 = S;
        LightParams param_9 = DL;
        Fd += (Diffuse_Lambert(param_8, param_9) * coatAttenuate_DL);
        SurfaceParams param_10 = S;
        LightParams param_11 = DL;
        Fr += (Specular_GGX_Low(param_10, param_11) * coatAttenuate_DL);
    }
    DL = LG.DirLights[2];
    if (DL.enable > 0.5)
    {
        float coatAttenuate_DL_1 = 1.0;
        SurfaceParams param_12 = S;
        LightParams param_13 = DL;
        Fd += (Diffuse_Lambert(param_12, param_13) * coatAttenuate_DL_1);
        SurfaceParams param_14 = S;
        LightParams param_15 = DL;
        Fr += (Specular_GGX_Low(param_14, param_15) * coatAttenuate_DL_1);
    }
    LightParams PL = LG.PointLights[0];
    if (PL.enable > 0.5)
    {
        float coatAttenuate_PL = 1.0;
        SurfaceParams param_16 = S;
        LightParams param_17 = PL;
        Fd += (Diffuse_Lambert(param_16, param_17) * coatAttenuate_PL);
        SurfaceParams param_18 = S;
        LightParams param_19 = PL;
        Fr += (Specular_GGX_Low(param_18, param_19) * coatAttenuate_PL);
    }
    PL = LG.PointLights[1];
    if (PL.enable > 0.5)
    {
        float coatAttenuate_PL_1 = 1.0;
        SurfaceParams param_20 = S;
        LightParams param_21 = PL;
        Fd += (Diffuse_Lambert(param_20, param_21) * coatAttenuate_PL_1);
        SurfaceParams param_22 = S;
        LightParams param_23 = PL;
        Fr += (Specular_GGX_Low(param_22, param_23) * coatAttenuate_PL_1);
    }
    LightParams SL = LG.SpotLights[0];
    if (SL.enable > 0.5)
    {
        float coatAttenuate_SL = 1.0;
        SurfaceParams param_24 = S;
        LightParams param_25 = SL;
        Fd += (Diffuse_Lambert(param_24, param_25) * coatAttenuate_SL);
        SurfaceParams param_26 = S;
        LightParams param_27 = SL;
        Fr += (Specular_GGX_Low(param_26, param_27) * coatAttenuate_SL);
    }
    SL = LG.SpotLights[1];
    if (SL.enable > 0.5)
    {
        float coatAttenuate_SL_1 = 1.0;
        SurfaceParams param_28 = S;
        LightParams param_29 = SL;
        Fd += (Diffuse_Lambert(param_28, param_29) * coatAttenuate_SL_1);
        SurfaceParams param_30 = S;
        LightParams param_31 = SL;
        Fr += (Specular_GGX_Low(param_30, param_31) * coatAttenuate_SL_1);
    }
    float3 finalRGB = Fd + Fr;
    return finalRGB;
}

static inline __attribute__((always_inline))
float3 LinearToGamma(thread const float3& col)
{
    return float3(pow(col.x, 0.4545449912548065185546875), pow(col.y, 0.4545449912548065185546875), pow(col.z, 0.4545449912548065185546875));
}

static inline __attribute__((always_inline))
float4 MainEntry(thread const texture2d<float> envTex, thread const sampler envTexSmplr, thread const float& envInt, thread const float& envRot, thread const float3& albedo, thread const float& opacity, thread const float& cutoff, thread const float3& normal, thread const float3& clearCoatNormal, thread const float& metallic, thread const float& roughness, thread const float& ao, thread const float& subsurface, thread const float3& subsurfaceCol, thread const float3& subsurfaceColMultiply, thread const float& ior, thread const float& transmittance, thread const float& transmittanceColorAtDistance, thread const float& thin, thread const float& clearCoat, thread const float& clearCoatRoughness, thread const float3& emissive, thread const float& anisotropic, thread const float& anisotropicRotate, thread const float& rampID, thread const float& rim, thread const float3& rimCol, thread const float3& ambient, thread const float3& matcap, thread const float& smoothFactor, thread float3& v_posWS, thread float3& v_nDirWS, thread float3& v_tDirWS, thread float3& v_bDirWS, constant float4& u_WorldSpaceCameraPos, constant spvUnsafeArray<float, 3>& u_DirLightsEnabled, constant float& u_DirLightNum, constant spvUnsafeArray<float4, 3>& u_DirLightsDirection, constant spvUnsafeArray<float4, 3>& u_DirLightsColor, constant spvUnsafeArray<float, 3>& u_DirLightsIntensity, constant spvUnsafeArray<float, 2>& u_PointLightsEnabled, constant float& u_PointLightNum, constant spvUnsafeArray<float4, 2>& u_PointLightsPosition, constant spvUnsafeArray<float4, 2>& u_PointLightsColor, constant spvUnsafeArray<float, 2>& u_PointLightsIntensity, constant spvUnsafeArray<float, 2>& u_PointLightsAttenRangeInv, constant spvUnsafeArray<float, 2>& u_SpotLightsEnabled, constant float& u_SpotLightNum, constant spvUnsafeArray<float4, 2>& u_SpotLightsPosition, constant spvUnsafeArray<float4, 2>& u_SpotLightsColor, constant spvUnsafeArray<float, 2>& u_SpotLightsIntensity, constant spvUnsafeArray<float, 2>& u_SpotLightsAttenRangeInv, constant spvUnsafeArray<float4, 2>& u_SpotLightsDirection, constant spvUnsafeArray<float, 2>& u_SpotLightsOuterAngleCos, constant spvUnsafeArray<float, 2>& u_SpotLightsInnerAngleCos)
{
    VSOutput V = BuildVSOutput(v_posWS, v_nDirWS, v_tDirWS, v_bDirWS);
    VSOutput param = V;
    float param_1 = envInt;
    float param_2 = envRot;
    float3 param_3 = albedo;
    float param_4 = opacity;
    float param_5 = cutoff;
    float3 param_6 = normal;
    float3 param_7 = clearCoatNormal;
    float param_8 = metallic;
    float param_9 = roughness;
    float param_10 = ao;
    float param_11 = subsurface;
    float3 param_12 = subsurfaceCol;
    float3 param_13 = subsurfaceColMultiply;
    float param_14 = ior;
    float param_15 = transmittance;
    float param_16 = transmittanceColorAtDistance;
    float param_17 = thin;
    float param_18 = clearCoat;
    float param_19 = clearCoatRoughness;
    float3 param_20 = emissive;
    float param_21 = anisotropic;
    float param_22 = anisotropicRotate;
    float param_23 = rampID;
    float param_24 = rim;
    float3 param_25 = rimCol;
    float3 param_26 = ambient;
    float3 param_27 = matcap;
    float param_28 = smoothFactor;
    SurfaceParams S = BuildSurfaceParams(param, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, param_12, param_13, param_14, param_15, param_16, param_17, param_18, param_19, param_20, param_21, param_22, param_23, param_24, param_25, param_26, param_27, param_28, u_WorldSpaceCameraPos);
    float param_29 = envInt;
    float param_30 = envRot;
    EnvironmentParams E = BuildEnvironmentParams(param_29, param_30);
    SurfaceParams param_31 = S;
    LightGroupParams LG = BuildLightGroupParams(param_31, u_DirLightsEnabled, u_DirLightNum, u_DirLightsDirection, u_DirLightsColor, u_DirLightsIntensity, u_PointLightsEnabled, u_PointLightNum, u_PointLightsPosition, u_PointLightsColor, u_PointLightsIntensity, u_PointLightsAttenRangeInv, u_SpotLightsEnabled, u_SpotLightNum, u_SpotLightsPosition, u_SpotLightsColor, u_SpotLightsIntensity, u_SpotLightsAttenRangeInv, u_SpotLightsDirection, u_SpotLightsOuterAngleCos, u_SpotLightsInnerAngleCos);
    VSOutput param_32 = V;
    SurfaceParams param_33 = S;
    EnvironmentParams param_34 = E;
    LightGroupParams param_35 = LG;
    float3 finalRGB = Lighting(param_32, param_33, param_34, envTex, envTexSmplr, param_35);
    float3 param_36 = finalRGB;
    finalRGB = LinearToGamma(param_36);
    float4 result = float4(finalRGB, S.opacity);
    return result;
}

static inline __attribute__((always_inline))
float4 ApplyBlendMode(thread const float4& color, thread const float2& uv)
{
    float4 ret = color;
    return ret;
}

fragment main0_out main0(main0_in in [[stage_in]], constant buffer_t& buffer, texture2d<float> _AmbientTexture [[texture(0)]], sampler _AmbientTextureSmplr [[sampler(0)]])
{
    main0_out out = {};
    float2 uv0 = in.v_uv0;
    float envInt = buffer._AmbientIntensity;
    float envRot = buffer._AmbientRotation;
    float3 param = buffer._AlbedoColor.xyz;
    float3 albedo = GammaToLinear(param);
    float opacity = buffer._AlbedoColor.w;
    float metallic = buffer._Metallic;
    float roughness = buffer._Roughness;
    float ao = 1.0;
    float3 clearCoatNormal = in.v_nDirWS;
    float3 normal = in.v_nDirWS;
    float param_1 = envInt;
    float param_2 = envRot;
    float3 param_3 = albedo;
    float param_4 = opacity;
    float cutoff;
    float param_5 = cutoff;
    float3 param_6 = normal;
    float3 param_7 = clearCoatNormal;
    float param_8 = metallic;
    float param_9 = roughness;
    float param_10 = ao;
    float subsurface;
    float param_11 = subsurface;
    float3 subsurfaceCol;
    float3 param_12 = subsurfaceCol;
    float3 subsurfaceColMultiply;
    float3 param_13 = subsurfaceColMultiply;
    float ior;
    float param_14 = ior;
    float transmittance;
    float param_15 = transmittance;
    float transmittanceColorAtDistance;
    float param_16 = transmittanceColorAtDistance;
    float thin;
    float param_17 = thin;
    float clearCoat;
    float param_18 = clearCoat;
    float clearCoatRoughness;
    float param_19 = clearCoatRoughness;
    float3 emissive;
    float3 param_20 = emissive;
    float anisotropic;
    float param_21 = anisotropic;
    float anisotropicRotate;
    float param_22 = anisotropicRotate;
    float rampID;
    float param_23 = rampID;
    float rim;
    float param_24 = rim;
    float3 rimCol;
    float3 param_25 = rimCol;
    float3 ambient;
    float3 param_26 = ambient;
    float3 matcap;
    float3 param_27 = matcap;
    float smoothFactor;
    float param_28 = smoothFactor;
    float4 finalColor = MainEntry(_AmbientTexture, _AmbientTextureSmplr, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, param_12, param_13, param_14, param_15, param_16, param_17, param_18, param_19, param_20, param_21, param_22, param_23, param_24, param_25, param_26, param_27, param_28, in.v_posWS, in.v_nDirWS, in.v_tDirWS, in.v_bDirWS, buffer.u_WorldSpaceCameraPos, buffer.u_DirLightsEnabled, buffer.u_DirLightNum, buffer.u_DirLightsDirection, buffer.u_DirLightsColor, buffer.u_DirLightsIntensity, buffer.u_PointLightsEnabled, buffer.u_PointLightNum, buffer.u_PointLightsPosition, buffer.u_PointLightsColor, buffer.u_PointLightsIntensity, buffer.u_PointLightsAttenRangeInv, buffer.u_SpotLightsEnabled, buffer.u_SpotLightNum, buffer.u_SpotLightsPosition, buffer.u_SpotLightsColor, buffer.u_SpotLightsIntensity, buffer.u_SpotLightsAttenRangeInv, buffer.u_SpotLightsDirection, buffer.u_SpotLightsOuterAngleCos, buffer.u_SpotLightsInnerAngleCos);
    float2 ndc_coord = in.v_gl_pos.xy / float2(in.v_gl_pos.w);
    float2 screen_coord = (ndc_coord * 0.5) + float2(0.5);
    float4 param_29 = finalColor;
    float2 param_30 = screen_coord;
    out.glResult = ApplyBlendMode(param_29, param_30);
    return out;
}

