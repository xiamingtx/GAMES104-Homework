#version 310 es

#extension GL_GOOGLE_include_directive : enable

#include "constants.h"

layout(input_attachment_index = 0, set = 0, binding = 0) uniform highp subpassInput in_color;

layout(set = 0, binding = 1) uniform sampler2D color_grading_lut_texture_sampler;

layout(location = 0) out highp vec4 out_color;

void main()
{
    // Ref1: https://blog.csdn.net/hijackedbycsdn/article/details/131161332?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522172009806516800184132884%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=172009806516800184132884&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-1-131161332-null-null.142^v100^pc_search_result_base1&utm_term=games104%E4%BD%9C%E4%B8%9A2&spm=1018.2226.3001.4187
    // Ref2: https://blog.csdn.net/t1370620378/article/details/125414521?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522172009806516800184132884%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=172009806516800184132884&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduend~default-2-125414521-null-null.142^v100^pc_search_result_base1&utm_term=games104%E4%BD%9C%E4%B8%9A2&spm=1018.2226.3001.4187
    
    // Get the size of the colour grading lookup table 
    highp ivec2 lut_tex_size = textureSize(color_grading_lut_texture_sampler, 0);
    // store the size of y-direction in the _COLORS constant
    highp float _COLORS      = float(lut_tex_size.y);

    // Load the colour values
    highp vec4 color       = subpassLoad(in_color).rgba;
    
    // calculate the num of color blocks
    highp vec2 lutSize = vec2(lut_tex_size.x, lut_tex_size.y);
    highp float blockNum = lutSize.x / lutSize.y;
    
    // The colours have been converted to sRGB space, and colour values are between 0 and 1.
    // Multiply the blue channel value of input colour by the blocks nums to get the 
    // position of the block in the LUT where the input colour is located.
    highp float blockIndexL = floor(color.b * blockNum);
    highp float blockIndexR = ceil(color.b * blockNum);

    // Calculate the u-values of the left and right maps (normalised to 0-1)
    highp float lutCoordXL = (blockIndexL * lutSize.y + color.r * lutSize.y) / lutSize.x;
    highp float lutCoordXR = (blockIndexR * lutSize.y + color.r * lutSize.y) / lutSize.x;

    // Use the green channel as the v-value for the lookup table
    highp float lutCoorY = color.g;

    // Constructing lookup table coordinates
    highp vec2 lutCoordL = vec2(lutCoordXL, lutCoorY);
    highp vec2 lutCoordR = vec2(lutCoordXR, lutCoorY);

    // Reading the colour value from the lookup table
    highp vec4 lutcolorL = texture(color_grading_lut_texture_sampler, lutCoordL);
    highp vec4 lutcolorR = texture(color_grading_lut_texture_sampler, lutCoordR);

    // Calculate interpolation weights
    highp float weight = fract(color.b * blockNum);

    // Interpolates and outputs the final colour
    out_color = mix(lutcolorL, lutcolorR, weight);
}
