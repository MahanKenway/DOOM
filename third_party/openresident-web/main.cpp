#include <emscripten/emscripten.h>
#include <emscripten/html5_webgl.h>

#include "render.h"

static bool gRendererReady = false;

extern EMSCRIPTEN_WEBGL_CONTEXT_HANDLE webContext;
extern EMSCRIPTEN_RESULT webContextMakeCurrentResult;

extern "C" {

/**
 * Create the WebGL2 renderer against a host canvas with id="canvas".
 * This is intentionally a graphics-only probe: OpenResident's source tree
 * includes no Resident Evil game data, so calling gameInit() would be both
 * technically invalid and inappropriate for a redistributable web build.
 */
EMSCRIPTEN_KEEPALIVE
int openresident_web_graphics_probe(int32 width, int32 height)
{
    if (!gRendererReady)
    {
        renderInit();
        if (webContext <= 0 || webContextMakeCurrentResult != EMSCRIPTEN_RESULT_SUCCESS)
            return 0;
        gRendererReady = true;
    }

    renderResize(width, height);
    renderClear();
    renderSwap();
    return 1;
}

EMSCRIPTEN_KEEPALIVE
void openresident_web_shutdown()
{
    if (!gRendererReady)
        return;

    renderFree();
    gRendererReady = false;
}

}
