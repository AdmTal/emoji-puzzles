#version 300 es

uniform mat4 u_Palatte[50];
uniform mat4 u_MVP;

layout(location = 0) in vec3 attPosition;
layout(location = 1) in vec4 attBoneIds;
layout(location = 2) in vec4 attWeights;

void main()
{
    vec4 homogeneous_pos = vec4(attPosition, 1.0);
    mat4 boneTransform = u_Palatte[int(attBoneIds.x)] * attWeights.x;
    mat4 _50 = u_Palatte[int(attBoneIds.y)] * attWeights.y;
    boneTransform = mat4(boneTransform[0] + _50[0], boneTransform[1] + _50[1], boneTransform[2] + _50[2], boneTransform[3] + _50[3]);
    mat4 _73 = u_Palatte[int(attBoneIds.z)] * attWeights.z;
    boneTransform = mat4(boneTransform[0] + _73[0], boneTransform[1] + _73[1], boneTransform[2] + _73[2], boneTransform[3] + _73[3]);
    mat4 _96 = u_Palatte[int(attBoneIds.w)] * attWeights.w;
    boneTransform = mat4(boneTransform[0] + _96[0], boneTransform[1] + _96[1], boneTransform[2] + _96[2], boneTransform[3] + _96[3]);
    gl_Position = (u_MVP * boneTransform) * vec4(attPosition, 1.0);
}

