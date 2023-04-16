#version 300 es
precision highp float;
precision highp int;

uniform mediump sampler2D u_FBOTexture;
uniform float radius;

in vec2 screenUV;
in vec2 orgUV;
in vec2 modelScale;
layout(location = 0) out vec4 o_FragColor;

void main()
{
    mediump vec4 finalColor = texture(u_FBOTexture, screenUV);
    mediump vec2 intersection = normalize(orgUV) * radius;
    mediump vec2 intersectionOval = vec2(intersection.x * modelScale.x, intersection.y * modelScale.y);
    mediump vec2 orgUVOval = vec2(orgUV.x * modelScale.x, orgUV.y * modelScale.y);
    mediump vec2 tangentOval = vec2(1.0);
    mediump float sinTheta = 1.0;
    if (!(intersectionOval.y == 0.0))
    {
        tangentOval = vec2(1.0, (((-1.0) * pow(modelScale.y, 2.0)) * intersectionOval.x) / (pow(modelScale.x, 2.0) * intersectionOval.y));
        mediump vec3 a = normalize(vec3(tangentOval, 0.0));
        mediump vec3 b = normalize(vec3(orgUVOval, 0.0));
        sinTheta = length(cross(a, b));
    }
    if ((length(intersectionOval) - length(orgUVOval)) >= 0.0)
    {
        if ((length(orgUVOval - intersectionOval) * sinTheta) <= 0.20000000298023223876953125)
        {
            finalColor = mix(finalColor, vec4(0.2980000078678131103515625, 0.5759999752044677734375, 0.913999974727630615234375, 0.5), vec4(1.0));
        }
    }
    o_FragColor = finalColor;
}

