#version 300 es

uniform mat4 u_MVP;
uniform vec2 signFlag;
uniform vec2 intensity;
uniform float radius;
uniform mat4 u_Model;

layout(location = 0) in vec3 attPosition;
out vec2 screenUV;
out vec2 modelScale;
out vec2 orgUV;
layout(location = 1) in vec2 attTexcoord0;

void main()
{
    gl_Position = u_MVP * vec4(attPosition, 1.0);
    float dist = length(attPosition.xy);
    vec2 flag = sign(signFlag * attPosition.xy);
    flag = vec2(1.0 - length(sign(signFlag))) + ((flag * (flag + vec2(1.0))) * 0.5);
    vec2 finalUV = attPosition.xy;
    if (intensity.x > 0.0)
    {
        float scale = (1.0 - intensity.x) + (intensity.x * smoothstep(0.0, 1.0, pow(dist / radius, 2.0)));
        finalUV.x *= (((scale - 1.0) * flag.x) + 1.0);
    }
    else
    {
        float scale_1 = (1.0 + intensity.x) - (intensity.x * smoothstep(-0.300000011920928955078125, 1.0, dist / radius));
        finalUV.x /= (((scale_1 - 1.0) * flag.x) + 1.0);
    }
    if (intensity.y > 0.0)
    {
        float scale_2 = (1.0 - intensity.y) + (intensity.y * smoothstep(0.0, 1.0, pow(dist / radius, 2.0)));
        finalUV.y *= (((scale_2 - 1.0) * flag.y) + 1.0);
    }
    else
    {
        float scale_3 = (1.0 + intensity.y) - (intensity.y * smoothstep(-0.300000011920928955078125, 1.0, dist / radius));
        finalUV.y /= (((scale_3 - 1.0) * flag.y) + 1.0);
    }
    vec4 tmp = u_MVP * vec4(finalUV.x, finalUV.y, 0.0, 1.0);
    screenUV = (vec2(tmp.x / tmp.w, tmp.y / tmp.w) * 0.5) + vec2(0.5);
    modelScale = vec2(length(u_Model[0].xyz), length(u_Model[1].xyz));
    orgUV = attPosition.xy;
}

