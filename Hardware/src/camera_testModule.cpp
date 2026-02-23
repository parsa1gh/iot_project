// #include "cam_module.h"
#include "esp_camera.h"
#include "esp_system.h"
#include "esp_heap_caps.h"
#include "display_module.h"
#include "fb_gfx.h"
#include "fd_forward.h" // کتابخانه تشخیص چهره
#include "fr_forward.h" // کتابخانه شناسایی چهره
// AI Thinker pin map
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27

#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

bool camInit()
{
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sscb_sda = SIOD_GPIO_NUM;
    config.pin_sscb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;

    config.pixel_format = PIXFORMAT_RGB888;
    config.frame_size = FRAMESIZE_VGA;
    config.fb_count = 1;
    config.xclk_freq_hz = 10000000;

    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK)
    {
        return false;
    }
    delay(500);
    return true;
}

int detectAndExtract(float *out_embedding)
{
    camera_fb_t *fb = nullptr;
    dl_matrix3du_t *img = nullptr;
    dl_matrix3du_t *aligned = nullptr;
    dl_matrix3d_t *id = nullptr;
    box_array_t *faces = nullptr;
    mtmn_config_t mtmn = {}; // moved up

    fb = esp_camera_fb_get();
    if (!fb)
        return -2; // camera error

    img = dl_matrix3du_alloc(1, fb->width, fb->height, 3);
    if (!img)
        goto cleanup;

    if (!fmt2rgb888(fb->buf, fb->len, fb->format, img->item))
        goto cleanup;

    mtmn.type = FAST;
    mtmn.min_face = 20;
    mtmn.pyramid = 0.707;
    mtmn.p_threshold.score = 0.4;
    mtmn.p_threshold.nms = 0.7;
    mtmn.r_threshold.score = 0.4;
    mtmn.r_threshold.nms = 0.7;
    mtmn.o_threshold.score = 0.4;
    mtmn.o_threshold.nms = 0.4;
    // فعال‌سازی DMA برای بهبود عملکرد
    esp_camera_fb_return(fb);
    fb = NULL;
    faces = face_detect(img, &mtmn);
    if (!faces || faces->len == 0)
        goto cleanup;

    aligned = dl_matrix3du_alloc(1, 56, 56, 3);
    if (!aligned)
        goto cleanup;

    if (align_face(faces, img, aligned) != ESP_OK)
        goto cleanup;

    id = get_face_id(aligned);
    if (!id)
        goto cleanup;

    memcpy(out_embedding, id->item, 128 * sizeof(float));

cleanup: // تنها یک cleanup
    if (id)
        dl_matrix3d_free(id);
    if (aligned)
        dl_matrix3du_free(aligned);
    if (faces)
    {
        free(faces->box);
        free(faces);
    }
    if (img)
        dl_matrix3du_free(img);
    if (fb)
        esp_camera_fb_return(fb);

    return (faces && faces->len > 0 && id) ? 1 : 0;
}