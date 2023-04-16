#version 300 es
precision highp float;
precision highp int;

struct SurfaceParams
{
    vec3 albedo;
    float opacity;
    float cutoff;
    vec3 emissive;
    vec2 metalParams;
    vec3 roughParams;
    vec3 clearCoatRoughParams;
    vec2 occParams;
    vec3 diffCol;
    vec3 specCol;
    vec2 anisoParams;
    float thin;
    float subsurface;
    vec3 subsurfaceColMultiply;
    vec3 subsurfaceCol;
    float ior;
    float transmittance;
    float transmittanceColorAtDistance;
    float clearCoat;
    vec3 pos;
    vec3 nDir;
    vec3 vnDir;
    vec3 cnDir;
    vec3 tDir;
    vec3 bDir;
    vec3 vDir;
    vec3 rDir;
    vec3 crDir;
};

struct LightParams
{
    float enable;
    vec3 lDir;
    vec3 color;
    float intensity;
    vec3 attenuate;
};

struct EnvironmentParams
{
    float intensity;
    float rotation;
};

struct VSOutput
{
    vec3 posWS;
    vec3 nDirWS;
    vec3 tDirWS;
    vec3 bDirWS;
};

struct LightGroupParams
{
    LightParams DirLights[3];
    LightParams PointLights[2];
    LightParams SpotLights[2];
    float dummy;
};

uniform vec4 u_WorldSpaceCameraPos;
uniform float u_DirLightsEnabled[3];
uniform float u_DirLightNum;
uniform vec4 u_DirLightsDirection[3];
uniform vec4 u_DirLightsColor[3];
uniform float u_DirLightsIntensity[3];
uniform float u_PointLightsEnabled[2];
uniform float u_PointLightNum;
uniform vec4 u_PointLightsPosition[2];
uniform vec4 u_PointLightsColor[2];
uniform float u_PointLightsIntensity[2];
uniform float u_PointLightsAttenRangeInv[2];
uniform float u_SpotLightsEnabled[2];
uniform float u_SpotLightNum;
uniform vec4 u_SpotLightsPosition[2];
uniform vec4 u_SpotLightsColor[2];
uniform float u_SpotLightsIntensity[2];
uniform float u_SpotLightsAttenRangeInv[2];
uniform vec4 u_SpotLightsDirection[2];
uniform float u_SpotLightsOuterAngleCos[2];
uniform float u_SpotLightsInnerAngleCos[2];
uniform float _AmbientIntensity;
uniform float _AmbientRotation;
uniform vec4 _AlbedoColor;
uniform float _Metallic;
uniform float _Roughness;
uniform mediump sampler2D _AmbientTexture;
uniform float _Occlusion;
uniform float u_Thin;
uniform mediump sampler2D u_ThinHeightTex;
uniform mat4 u_VP;
uniform vec4 u_Time;
uniform mediump sampler2D u_FBOTexture;

in vec3 v_posWS;
in vec3 v_nDirWS;
in vec3 v_tDirWS;
in vec3 v_bDirWS;
in vec2 v_uv0;
in vec4 v_gl_pos;
layout(location = 0) out vec4 glResult;

vec3 GammaToLinear(vec3 col)
{
    return vec3(pow(col.x, 2.2000000476837158203125), pow(col.y, 2.2000000476837158203125), pow(col.z, 2.2000000476837158203125));
}

VSOutput BuildVSOutput()
{
    VSOutput V;
    V.posWS = v_posWS;
    V.nDirWS = normalize(v_nDirWS);
    V.tDirWS = normalize(v_tDirWS);
    V.bDirWS = normalize(v_bDirWS);
    return V;
}

float saturate(float x)
{
    return clamp(x, 0.0, 1.0);
}

float Pow2(float x)
{
    return x * x;
}

float SpecularAO(SurfaceParams S)
{
    float ndv = max(0.0, dot(S.nDir, S.vDir));
    float visibility = S.occParams.x;
    float perceptualRoughness = S.roughParams.x;
    float param = (pow(ndv + visibility, exp2(((-16.0) * perceptualRoughness) - 1.0)) - 1.0) + visibility;
    float lagardeAO = saturate(param);
    float horizon = min(1.0 + dot(S.rDir, S.nDir), 1.0);
    float horizonAO = horizon * horizon;
    return lagardeAO * horizonAO;
}

SurfaceParams BuildSurfaceParams(VSOutput V, float envInt, float envRot, vec3 albedo, float opacity, float cutoff, vec3 normal, vec3 clearCoatNormal, float metallic, float roughness, float ao, float subsurface, vec3 subsurfaceCol, vec3 subsurfaceColMultiply, float ior, float transmittance, float transmittanceColorAtDistance, float thin, float clearCoat, float clearCoatRoughness, vec3 emissive, float anisotropic, float anisotropicRotate, float rampID, float rim, vec3 rimCol, vec3 ambient, vec3 matcap, float smoothFactor)
{
    SurfaceParams S;
    S.albedo = albedo;
    S.opacity = opacity;
    float param = metallic;
    S.metalParams.x = saturate(param);
    S.metalParams.y = 0.959999978542327880859375 * (1.0 - S.metalParams.x);
    S.roughParams.x = clamp(roughness, 0.07999999821186065673828125, 1.0);
    float param_1 = S.roughParams.x;
    S.roughParams.y = Pow2(param_1);
    float param_2 = S.roughParams.y;
    S.roughParams.z = Pow2(param_2);
    float param_3 = ao;
    S.occParams.x = saturate(param_3);
    float param_4 = thin;
    S.thin = saturate(param_4);
    S.clearCoat = clearCoat;
    S.emissive = emissive;
    S.diffCol = S.albedo * S.metalParams.y;
    S.specCol = mix(vec3(0.039999999105930328369140625), S.albedo, vec3(S.metalParams.x));
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
    vec3 _1445;
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

EnvironmentParams BuildEnvironmentParams(float envInt, float envRot)
{
    EnvironmentParams E;
    E.intensity = envInt;
    E.rotation = envRot;
    return E;
}

LightParams BuildDirLightParams(SurfaceParams S, mediump int index)
{
    LightParams ML;
    ML.enable = u_DirLightsEnabled[index] * step(float(index) + 0.5, u_DirLightNum);
    ML.lDir = normalize(-u_DirLightsDirection[index].xyz);
    ML.color = u_DirLightsColor[index].xyz;
    ML.intensity = u_DirLightsIntensity[index] * ML.enable;
    ML.attenuate = vec3(1.0);
    return ML;
}

float Pow4(float x)
{
    float x2 = x * x;
    return x2 * x2;
}

LightParams BuildPointLightParams(SurfaceParams S, mediump int index)
{
    vec3 lVec = vec3(0.0);
    float lDist = 0.0;
    LightParams PL1;
    PL1.enable = u_PointLightsEnabled[index] * step(float(index) + 0.5, u_PointLightNum);
    lVec = u_PointLightsPosition[index].xyz - S.pos;
    lDist = length(lVec);
    PL1.lDir = lVec / vec3(lDist);
    PL1.color = u_PointLightsColor[index].xyz;
    PL1.intensity = u_PointLightsIntensity[index] * PL1.enable;
    lDist *= u_PointLightsAttenRangeInv[index];
    float param = lDist;
    float param_1 = 1.0 - Pow4(param);
    float param_2 = saturate(param_1);
    float param_3 = lDist;
    float attenuate = (Pow2(param_2) * (Pow2(param_3) + 1.0)) * 0.25;
    PL1.attenuate = vec3(attenuate, attenuate, attenuate);
    return PL1;
}

LightParams BuildSpotLightParams(SurfaceParams S, mediump int index)
{
    vec3 lVec = vec3(0.0);
    float lDist = 0.0;
    vec3 spotDir = vec3(0.0);
    float angleAtten = 0.0;
    LightParams SL1;
    SL1.enable = u_SpotLightsEnabled[index] * step(float(index) + 0.5, u_SpotLightNum);
    lVec = u_SpotLightsPosition[index].xyz - S.pos;
    lDist = length(lVec);
    SL1.lDir = lVec / vec3(lDist);
    SL1.color = u_SpotLightsColor[index].xyz;
    SL1.intensity = u_SpotLightsIntensity[index] * SL1.enable;
    lDist *= u_SpotLightsAttenRangeInv[index];
    float param = lDist;
    float param_1 = 1.0 - Pow4(param);
    float param_2 = saturate(param_1);
    float param_3 = lDist;
    float attenuate = (Pow2(param_2) * (Pow2(param_3) + 1.0)) * 0.25;
    spotDir = normalize(-u_SpotLightsDirection[index].xyz);
    angleAtten = max(0.0, dot(SL1.lDir, spotDir));
    attenuate *= smoothstep(u_SpotLightsOuterAngleCos[index], u_SpotLightsInnerAngleCos[index], angleAtten);
    SL1.attenuate = vec3(attenuate, attenuate, attenuate);
    return SL1;
}

LightGroupParams BuildLightGroupParams(SurfaceParams S)
{
    LightGroupParams LG;
    LG.dummy = 0.0;
    SurfaceParams param = S;
    mediump int param_1 = 0;
    LG.DirLights[0] = BuildDirLightParams(param, param_1);
    SurfaceParams param_2 = S;
    mediump int param_3 = 1;
    LG.DirLights[1] = BuildDirLightParams(param_2, param_3);
    SurfaceParams param_4 = S;
    mediump int param_5 = 2;
    LG.DirLights[2] = BuildDirLightParams(param_4, param_5);
    SurfaceParams param_6 = S;
    mediump int param_7 = 0;
    LG.PointLights[0] = BuildPointLightParams(param_6, param_7);
    SurfaceParams param_8 = S;
    mediump int param_9 = 1;
    LG.PointLights[1] = BuildPointLightParams(param_8, param_9);
    SurfaceParams param_10 = S;
    mediump int param_11 = 0;
    LG.SpotLights[0] = BuildSpotLightParams(param_10, param_11);
    SurfaceParams param_12 = S;
    mediump int param_13 = 1;
    LG.SpotLights[1] = BuildSpotLightParams(param_12, param_13);
    return LG;
}

float Atan2(float x, float y)
{
    float signx = (x < 0.0) ? (-1.0) : 1.0;
    return signx * acos(clamp(y / length(vec2(x, y)), -1.0, 1.0));
}

vec2 GetPanoramicTexCoordsFromDir(inout vec3 dir, float rotation)
{
    dir = normalize(dir);
    float param = dir.x;
    float param_1 = -dir.z;
    vec2 uv;
    uv.x = (Atan2(param, param_1) - 1.57079637050628662109375) / 6.283185482025146484375;
    uv.y = acos(dir.y) / 3.1415927410125732421875;
    uv.x += rotation;
    uv.x = fract((uv.x + floor(uv.x)) + 1.0);
    return uv;
}

vec3 SamplerEncodedPanoramicWithUV(mediump sampler2D panoramic, vec2 uv, float lod)
{
    float lodMin = floor(lod);
    float lodLerp = lod - lodMin;
    vec2 uvLodMin = uv;
    vec2 uvLodMax = uv;
    vec2 size = vec2(0.0);
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
    vec4 envEncoded = mix(texture(panoramic, uvLodMin), texture(panoramic, uvLodMax), vec4(lodLerp));
    return envEncoded.xyz / vec3(envEncoded.w);
}

vec3 SamplerEncodedPanoramic(mediump sampler2D panoramic, vec3 dir, float rotation, float lod)
{
    vec3 param = dir;
    float param_1 = rotation;
    vec2 _1230 = GetPanoramicTexCoordsFromDir(param, param_1);
    vec2 uv = _1230;
    vec2 param_2 = uv;
    float param_3 = lod;
    return SamplerEncodedPanoramicWithUV(panoramic, param_2, param_3);
}

vec3 GTAO_MultiBounce(float visibility, vec3 albedo)
{
    vec3 a = (albedo * 2.040400028228759765625) - vec3(0.3323999941349029541015625);
    vec3 b = (albedo * (-4.79510021209716796875)) + vec3(0.6417000293731689453125);
    vec3 c = (albedo * 2.755199909210205078125) + vec3(0.69029998779296875);
    return max(vec3(visibility), ((((a * visibility) + b) * visibility) + c) * visibility);
}

vec3 Diffuse_Panoramic(SurfaceParams S, EnvironmentParams E, mediump sampler2D envTex)
{
    vec3 param = S.nDir;
    float param_1 = E.rotation;
    float param_2 = 7.0;
    vec3 lighting = SamplerEncodedPanoramic(envTex, param, param_1, param_2);
    float param_3 = S.occParams.x;
    vec3 param_4 = S.diffCol;
    vec3 multiBounceColor = GTAO_MultiBounce(param_3, param_4);
    return ((lighting * S.diffCol) * multiBounceColor) * E.intensity;
}

vec3 EnvBRDFApprox(SurfaceParams S)
{
    float ndv = max(0.0, dot(S.nDir, S.vDir));
    float perceptualRoughness = S.roughParams.x;
    vec4 r = (vec4(-1.0, -0.0274999998509883880615234375, -0.572000026702880859375, 0.02199999988079071044921875) * perceptualRoughness) + vec4(1.0, 0.0425000004470348358154296875, 1.03999996185302734375, -0.039999999105930328369140625);
    float a004 = (min(r.x * r.x, exp2((-9.27999973297119140625) * ndv)) * r.x) + r.y;
    vec2 AB = (vec2(-1.03999996185302734375, 1.03999996185302734375) * a004) + r.zw;
    float param = 50.0 * S.specCol.y;
    AB.y *= saturate(param);
    return (S.specCol * AB.x) + vec3(AB.y);
}

vec3 Specular_Panoramic(SurfaceParams S, EnvironmentParams E, mediump sampler2D envTex)
{
    vec3 dir = mix(S.rDir, S.nDir, vec3(S.roughParams.x * S.roughParams.y));
    vec3 param = dir;
    float param_1 = E.rotation;
    float param_2 = (S.roughParams.x - 0.07999999821186065673828125) * 7.0;
    vec3 specEnv = SamplerEncodedPanoramic(envTex, param, param_1, param_2);
    SurfaceParams param_3 = S;
    vec3 brdf = EnvBRDFApprox(param_3);
    float param_4 = S.occParams.y;
    vec3 param_5 = S.specCol;
    vec3 multiBounceColor = GTAO_MultiBounce(param_4, param_5);
    return ((brdf * specEnv) * multiBounceColor) * E.intensity;
}

vec3 Diffuse_OrenNayar(SurfaceParams S, LightParams L)
{
    vec3 hDir = normalize(L.lDir + S.vDir);
    float ndl = max(0.0, dot(S.nDir, L.lDir));
    float ndv = max(0.0, dot(S.nDir, S.vDir));
    float vdh = max(0.0, dot(S.vDir, hDir));
    float a = S.roughParams.y;
    float s = a;
    float s2 = s * s;
    float VoL = ((2.0 * vdh) * vdh) - 1.0;
    float Cosri = VoL - (ndv * ndl);
    float C1 = 1.0 - ((0.5 * s2) / (s2 + 0.3300000131130218505859375));
    float _422;
    if (Cosri >= 0.0)
    {
        _422 = 1.0 / max(ndl, ndv);
    }
    else
    {
        _422 = 1.0;
    }
    float C2 = (((0.449999988079071044921875 * s2) / (s2 + 0.0900000035762786865234375)) * Cosri) * _422;
    float lighting = ((C1 + C2) * (1.0 + (S.roughParams.x * 0.5))) * ndl;
    return (((S.diffCol * L.color) * L.intensity) * L.attenuate) * lighting;
}

float V_SmithJointApprox(float a, float ndv, float ndl)
{
    float lambdaV = ndl * ((ndv * (1.0 - a)) + a);
    float lambdaL = ndv * ((ndl * (1.0 - a)) + a);
    return 0.5 / ((lambdaV + lambdaL) + 9.9999997473787516355514526367188e-06);
}

float D_GGX(float ndh, float a2)
{
    float d = (((ndh * a2) - ndh) * ndh) + 1.0;
    return (a2 * 0.31830990314483642578125) / ((d * d) + 1.0000000116860974230803549289703e-07);
}

float Pow5(float x)
{
    float x2 = x * x;
    return (x2 * x2) * x;
}

vec3 F_Schlick(vec3 f0, float vdh)
{
    float param = 1.0 - vdh;
    float t = Pow5(param);
    return f0 + ((vec3(1.0) - f0) * t);
}

vec3 Specular_GGX(SurfaceParams S, LightParams L)
{
    vec3 hDir = normalize(L.lDir + S.vDir);
    float ndh = max(0.0, dot(S.nDir, hDir));
    float vdh = max(0.0, dot(S.vDir, hDir));
    float ndl = max(0.0, dot(S.nDir, L.lDir));
    float ndv = max(0.0, dot(S.nDir, S.vDir));
    float a = S.roughParams.y;
    float a2 = S.roughParams.z;
    float param = ndl;
    float param_1 = ndv;
    float param_2 = a;
    float V = V_SmithJointApprox(param, param_1, param_2);
    float param_3 = ndh;
    float param_4 = a2;
    float D = D_GGX(param_3, param_4);
    vec3 param_5 = S.specCol;
    float param_6 = vdh;
    vec3 F = F_Schlick(param_5, param_6);
    vec3 specular = ((((((F * V) * D) * 3.1415927410125732421875) * ndl) * L.color) * L.intensity) * L.attenuate;
    return specular;
}

vec3 Diffuse_Lambert(SurfaceParams S, LightParams L)
{
    float ndl = max(0.0, dot(S.nDir, L.lDir));
    float lighting = ndl;
    return (((S.diffCol * L.color) * L.intensity) * L.attenuate) * lighting;
}

float V_Const()
{
    return 0.25;
}

vec3 Specular_GGX_Low(SurfaceParams S, LightParams L)
{
    vec3 hDir = normalize(L.lDir + S.vDir);
    float ndh = max(0.0, dot(S.nDir, hDir));
    float vdh = max(0.0, dot(S.vDir, hDir));
    float ndl = max(0.0, dot(S.nDir, L.lDir));
    float a = S.roughParams.y;
    float a2 = S.roughParams.z;
    float V = V_Const();
    float param = ndh;
    float param_1 = a2;
    float D = D_GGX(param, param_1);
    vec3 param_2 = S.specCol;
    float param_3 = vdh;
    vec3 F = F_Schlick(param_2, param_3);
    vec3 specular = ((((((F * V) * D) * 3.1415927410125732421875) * ndl) * L.color) * L.intensity) * L.attenuate;
    return specular;
}

vec3 Lighting(VSOutput V, SurfaceParams S, EnvironmentParams E, mediump sampler2D envTex, LightGroupParams LG)
{
    vec3 Fd = vec3(0.0);
    vec3 Fr = vec3(0.0);
    float coatAttenuate_IBL = 1.0;
    SurfaceParams param = S;
    EnvironmentParams param_1 = E;
    Fd += (Diffuse_Panoramic(param, param_1, envTex) * coatAttenuate_IBL);
    SurfaceParams param_2 = S;
    EnvironmentParams param_3 = E;
    Fr += (Specular_Panoramic(param_2, param_3, envTex) * coatAttenuate_IBL);
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
    vec3 finalRGB = Fd + Fr;
    return finalRGB;
}

vec3 LinearToGamma(vec3 col)
{
    return vec3(pow(col.x, 0.4545449912548065185546875), pow(col.y, 0.4545449912548065185546875), pow(col.z, 0.4545449912548065185546875));
}

vec4 MainEntry(mediump sampler2D envTex, float envInt, float envRot, vec3 albedo, float opacity, float cutoff, vec3 normal, vec3 clearCoatNormal, float metallic, float roughness, float ao, float subsurface, vec3 subsurfaceCol, vec3 subsurfaceColMultiply, float ior, float transmittance, float transmittanceColorAtDistance, float thin, float clearCoat, float clearCoatRoughness, vec3 emissive, float anisotropic, float anisotropicRotate, float rampID, float rim, vec3 rimCol, vec3 ambient, vec3 matcap, float smoothFactor)
{
    VSOutput V = BuildVSOutput();
    VSOutput param = V;
    float param_1 = envInt;
    float param_2 = envRot;
    vec3 param_3 = albedo;
    float param_4 = opacity;
    float param_5 = cutoff;
    vec3 param_6 = normal;
    vec3 param_7 = clearCoatNormal;
    float param_8 = metallic;
    float param_9 = roughness;
    float param_10 = ao;
    float param_11 = subsurface;
    vec3 param_12 = subsurfaceCol;
    vec3 param_13 = subsurfaceColMultiply;
    float param_14 = ior;
    float param_15 = transmittance;
    float param_16 = transmittanceColorAtDistance;
    float param_17 = thin;
    float param_18 = clearCoat;
    float param_19 = clearCoatRoughness;
    vec3 param_20 = emissive;
    float param_21 = anisotropic;
    float param_22 = anisotropicRotate;
    float param_23 = rampID;
    float param_24 = rim;
    vec3 param_25 = rimCol;
    vec3 param_26 = ambient;
    vec3 param_27 = matcap;
    float param_28 = smoothFactor;
    SurfaceParams S = BuildSurfaceParams(param, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, param_12, param_13, param_14, param_15, param_16, param_17, param_18, param_19, param_20, param_21, param_22, param_23, param_24, param_25, param_26, param_27, param_28);
    float param_29 = envInt;
    float param_30 = envRot;
    EnvironmentParams E = BuildEnvironmentParams(param_29, param_30);
    SurfaceParams param_31 = S;
    LightGroupParams LG = BuildLightGroupParams(param_31);
    VSOutput param_32 = V;
    SurfaceParams param_33 = S;
    EnvironmentParams param_34 = E;
    LightGroupParams param_35 = LG;
    vec3 finalRGB = Lighting(param_32, param_33, param_34, envTex, param_35);
    vec3 param_36 = finalRGB;
    finalRGB = LinearToGamma(param_36);
    vec4 result = vec4(finalRGB, S.opacity);
    return result;
}

vec4 ApplyBlendMode(vec4 color, vec2 uv)
{
    vec4 ret = color;
    return ret;
}

void main()
{
    vec2 uv0 = v_uv0;
    float envInt = _AmbientIntensity;
    float envRot = _AmbientRotation;
    vec3 param = _AlbedoColor.xyz;
    vec3 albedo = GammaToLinear(param);
    float opacity = _AlbedoColor.w;
    float metallic = _Metallic;
    float roughness = _Roughness;
    float ao = 1.0;
    vec3 clearCoatNormal = v_nDirWS;
    vec3 normal = v_nDirWS;
    float param_1 = envInt;
    float param_2 = envRot;
    vec3 param_3 = albedo;
    float param_4 = opacity;
    float cutoff;
    float param_5 = cutoff;
    vec3 param_6 = normal;
    vec3 param_7 = clearCoatNormal;
    float param_8 = metallic;
    float param_9 = roughness;
    float param_10 = ao;
    float subsurface;
    float param_11 = subsurface;
    vec3 subsurfaceCol;
    vec3 param_12 = subsurfaceCol;
    vec3 subsurfaceColMultiply;
    vec3 param_13 = subsurfaceColMultiply;
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
    vec3 emissive;
    vec3 param_20 = emissive;
    float anisotropic;
    float param_21 = anisotropic;
    float anisotropicRotate;
    float param_22 = anisotropicRotate;
    float rampID;
    float param_23 = rampID;
    float rim;
    float param_24 = rim;
    vec3 rimCol;
    vec3 param_25 = rimCol;
    vec3 ambient;
    vec3 param_26 = ambient;
    vec3 matcap;
    vec3 param_27 = matcap;
    float smoothFactor;
    float param_28 = smoothFactor;
    vec4 finalColor = MainEntry(_AmbientTexture, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, param_12, param_13, param_14, param_15, param_16, param_17, param_18, param_19, param_20, param_21, param_22, param_23, param_24, param_25, param_26, param_27, param_28);
    vec2 ndc_coord = v_gl_pos.xy / vec2(v_gl_pos.w);
    vec2 screen_coord = (ndc_coord * 0.5) + vec2(0.5);
    vec4 param_29 = finalColor;
    vec2 param_30 = screen_coord;
    glResult = ApplyBlendMode(param_29, param_30);
}

