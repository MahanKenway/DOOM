#include <math.h>

#include <emscripten/emscripten.h>
#include <emscripten/html5_webgl.h>
#include <GLES3/gl3.h>

#include "render.h"

extern EMSCRIPTEN_WEBGL_CONTEXT_HANDLE webContext;
extern EMSCRIPTEN_RESULT webContextMakeCurrentResult;

enum InputAction
{
    ACTION_UP = 0,
    ACTION_RIGHT = 1,
    ACTION_DOWN = 2,
    ACTION_LEFT = 3,
    ACTION_SPRINT = 4,
    ACTION_MAX = 5
};

enum Phase
{
    PHASE_SEARCH = 0,
    PHASE_RESTORE = 1,
    PHASE_EXIT = 2,
    PHASE_COMPLETE = 3,
    PHASE_FAILED = 4
};

struct Rect
{
    float x, z, hx, hz;
};

struct Echo
{
    float x, z;
    float seed;
};

struct RelayGame
{
    bool ready;
    int32 width;
    int32 height;
    bool actions[ACTION_MAX];
    float playerX;
    float playerZ;
    float health;
    float damageCooldown;
    float time;
    bool cells[2];
    int32 cellCount;
    Phase phase;
    Echo echoes[2];
};

static RelayGame game = {};

// The upstream renderer uses the large world-unit scale of its native target
// and a near clipping plane of 256. Obsidian Relay keeps designer-friendly
// metre-like coordinates in simulation, then maps only its original geometry
// and camera into renderer units.
static const float WORLD_SCALE = 256.0f;

static const Rect solids[] = {
    { -6.0f,  2.0f, 1.10f, 1.20f },
    {  5.7f, -0.8f, 1.05f, 1.05f },
    {  3.3f,  5.0f, 0.55f, 3.00f },
    { -2.6f, -3.8f, 0.55f, 1.70f },
    {  0.0f, -8.2f, 1.60f, 0.75f }
};

static uint32 rgba(uint8 r, uint8 g, uint8 b, uint8 a = 255)
{
    return uint32(r) | (uint32(g) << 8) | (uint32(b) << 16) | (uint32(a) << 24);
}

static float clampf(float value, float minValue, float maxValue)
{
    return value < minValue ? minValue : (value > maxValue ? maxValue : value);
}

static float distSq(float ax, float az, float bx, float bz)
{
    float dx = ax - bx;
    float dz = az - bz;
    return dx * dx + dz * dz;
}

static bool blocked(float x, float z, float radius)
{
    if (x < -8.6f + radius || x > 8.6f - radius || z < -11.7f + radius || z > 11.4f - radius)
        return true;

    for (int32 i = 0; i < COUNT(solids); i++)
    {
        const Rect& rect = solids[i];
        float closeX = clampf(x, rect.x - rect.hx, rect.x + rect.hx);
        float closeZ = clampf(z, rect.z - rect.hz, rect.z + rect.hz);
        if (distSq(x, z, closeX, closeZ) < radius * radius)
            return true;
    }
    return false;
}

static void resetGame()
{
    memset(game.actions, 0, sizeof(game.actions));
    game.playerX = -6.8f;
    game.playerZ = 9.4f;
    game.health = 100.0f;
    game.damageCooldown = 0.0f;
    game.time = 0.0f;
    game.cells[0] = false;
    game.cells[1] = false;
    game.cellCount = 0;
    game.phase = PHASE_SEARCH;
    game.echoes[0] = { 0.8f, 1.1f, 0.3f };
    game.echoes[1] = { -4.8f, -4.7f, 1.9f };
}

static void moveActor(float& x, float& z, float dx, float dz, float radius)
{
    float candidateX = x + dx;
    if (!blocked(candidateX, z, radius))
        x = candidateX;
    float candidateZ = z + dz;
    if (!blocked(x, candidateZ, radius))
        z = candidateZ;
}

static void update(float dt)
{
    if (game.phase == PHASE_COMPLETE || game.phase == PHASE_FAILED)
        return;

    game.time += dt;
    game.damageCooldown = game.damageCooldown > 0.0f ? game.damageCooldown - dt : 0.0f;

    float xAxis = (game.actions[ACTION_RIGHT] ? 1.0f : 0.0f) - (game.actions[ACTION_LEFT] ? 1.0f : 0.0f);
    float zAxis = (game.actions[ACTION_DOWN] ? 1.0f : 0.0f) - (game.actions[ACTION_UP] ? 1.0f : 0.0f);
    float magnitude = sqrtf(xAxis * xAxis + zAxis * zAxis);
    if (magnitude > 0.001f)
    {
        xAxis /= magnitude;
        zAxis /= magnitude;
        float speed = game.actions[ACTION_SPRINT] ? 5.2f : 3.55f;
        moveActor(game.playerX, game.playerZ, xAxis * speed * dt, zAxis * speed * dt, 0.45f);
    }

    const float cellX[2] = { -6.6f, 6.25f };
    const float cellZ[2] = { -1.25f, 6.9f };
    for (int32 i = 0; i < 2; i++)
    {
        if (!game.cells[i] && distSq(game.playerX, game.playerZ, cellX[i], cellZ[i]) < 1.35f * 1.35f)
        {
            game.cells[i] = true;
            game.cellCount++;
            if (game.cellCount == 2)
                game.phase = PHASE_RESTORE;
        }
    }

    for (int32 i = 0; i < 2; i++)
    {
        Echo& echo = game.echoes[i];
        float dx = game.playerX - echo.x;
        float dz = game.playerZ - echo.z;
        float distance = sqrtf(dx * dx + dz * dz);
        if (distance < 10.5f && distance > 0.05f)
        {
            float speed = 1.05f + 0.13f * sinf(game.time * 2.2f + echo.seed);
            moveActor(echo.x, echo.z, dx / distance * speed * dt, dz / distance * speed * dt, 0.40f);
        }
        if (distance < 1.18f && game.damageCooldown <= 0.0f)
        {
            game.health -= 13.0f;
            game.damageCooldown = 1.05f;
            if (game.health <= 0.0f)
            {
                game.health = 0.0f;
                game.phase = PHASE_FAILED;
            }
        }
    }

    if (game.phase == PHASE_EXIT && game.playerZ < -10.55f && fabsf(game.playerX) < 1.45f)
        game.phase = PHASE_COMPLETE;
}

static void box(float x, float y, float z, float sx, float sy, float sz, uint32 color)
{
    // OpenResident's native room coordinate system uses negative Y for
    // height above a floor. The original game keeps normal positive-up values
    // in simulation and converts at the narrow renderer boundary.
    renderPrimitiveBox(
        (x - sx * 0.5f) * WORLD_SCALE, -(y + sy * 0.5f) * WORLD_SCALE, (z - sz * 0.5f) * WORLD_SCALE,
        (x + sx * 0.5f) * WORLD_SCALE, -(y - sy * 0.5f) * WORLD_SCALE, (z + sz * 0.5f) * WORLD_SCALE,
        color
    );
}

static void renderStation()
{
    const uint32 graphite = rgba(22, 29, 35);
    const uint32 panel = rgba(37, 47, 55);
    const uint32 dark = rgba(8, 13, 17);
    const uint32 cyan = rgba(17, 214, 221);
    const uint32 cyanDim = rgba(9, 92, 104);
    const uint32 amber = rgba(244, 144, 44);
    const uint32 rust = rgba(161, 74, 35);
    const uint32 echoDark = rgba(16, 27, 38);
    const uint32 core = rgba(84, 232, 255);

    renderPrimitiveSetFocus(game.playerX, game.playerZ);
    renderPrimitiveBegin();

    box(0.0f, -0.22f, 0.0f, 18.6f, 0.30f, 24.2f, graphite);
    box(0.0f, -0.04f, -3.7f, 17.0f, 0.06f, 0.10f, cyanDim);
    box(0.0f, -0.04f,  4.7f, 17.0f, 0.06f, 0.10f, cyanDim);

    box(-9.2f, 2.0f, 0.0f, 0.50f, 4.30f, 24.5f, panel);
    box( 9.2f, 2.0f, 0.0f, 0.50f, 4.30f, 24.5f, panel);
    box(0.0f, 2.0f, 11.85f, 18.6f, 4.30f, 0.50f, panel);
    box(-5.2f, 3.55f, 0.0f, 6.7f, 0.25f, 24.0f, dark);
    box( 5.2f, 3.55f, 0.0f, 6.7f, 0.25f, 24.0f, dark);

    for (int32 i = -4; i <= 4; i++)
    {
        box(i * 1.9f, 0.06f, 10.8f, 0.18f, 0.11f, 0.75f, cyanDim);
        box(-8.72f, 1.0f, i * 2.35f, 0.10f, 0.18f, 0.70f, cyan);
        box( 8.72f, 1.0f, i * 2.35f, 0.10f, 0.18f, 0.70f, cyan);
    }

    // Original obstacles and environment props.
    box(-6.0f, 0.72f, 2.0f, 2.20f, 1.45f, 2.40f, rust);
    box(-6.0f, 1.48f, 2.0f, 1.65f, 0.12f, 1.85f, panel);
    box(5.7f, 0.65f, -0.8f, 2.10f, 1.30f, 2.10f, rust);
    box(3.3f, 1.40f, 5.0f, 1.10f, 2.80f, 6.00f, panel);
    box(-2.6f, 1.35f, -3.8f, 1.10f, 2.70f, 3.40f, panel);

    // Relay console, with state-dependent indicator.
    box(0.0f, 0.80f, -8.2f, 3.20f, 1.60f, 1.50f, dark);
    box(0.0f, 1.65f, -8.32f, 2.45f, 0.20f, 0.45f, game.phase >= PHASE_EXIT ? cyan : amber);
    box(0.0f, 1.82f, -8.55f, 0.68f, 0.28f, 0.14f, game.cellCount == 2 ? cyan : amber);

    // Exit frame and plates.
    box(-2.0f, 1.85f, -11.55f, 0.45f, 3.70f, 0.55f, graphite);
    box( 2.0f, 1.85f, -11.55f, 0.45f, 3.70f, 0.55f, graphite);
    box(0.0f, 3.55f, -11.55f, 4.40f, 0.38f, 0.55f, graphite);
    if (game.phase < PHASE_EXIT)
    {
        box(-0.92f, 1.70f, -11.55f, 1.78f, 3.20f, 0.30f, dark);
        box( 0.92f, 1.70f, -11.55f, 1.78f, 3.20f, 0.30f, dark);
        box(0.0f, 1.70f, -11.72f, 0.16f, 3.15f, 0.36f, amber);
    }
    else
    {
        box(-2.65f, 1.70f, -11.55f, 0.55f, 3.20f, 0.30f, dark);
        box( 2.65f, 1.70f, -11.55f, 0.55f, 3.20f, 0.30f, dark);
    }

    // Collectible signal cells.
    const float cellX[2] = { -6.6f, 6.25f };
    const float cellZ[2] = { -1.25f, 6.9f };
    for (int32 i = 0; i < 2; i++)
    {
        if (!game.cells[i])
        {
            float pulse = 0.55f + 0.16f * sinf(game.time * 2.5f + i);
            box(cellX[i], 0.24f, cellZ[i], 0.62f, 0.48f, 0.20f, cyan);
            box(cellX[i], 0.56f + pulse * 0.10f, cellZ[i], 0.18f, 0.35f + pulse * 0.18f, 0.18f, core);
        }
    }

    // Explorer: original coat, legs, backpack, helmet and lamp.
    box(game.playerX, 0.45f, game.playerZ, 0.55f, 0.85f, 0.38f, rust);
    box(game.playerX - 0.18f, 0.13f, game.playerZ, 0.16f, 0.35f, 0.18f, dark);
    box(game.playerX + 0.18f, 0.13f, game.playerZ, 0.16f, 0.35f, 0.18f, dark);
    box(game.playerX, 1.03f, game.playerZ, 0.44f, 0.37f, 0.40f, graphite);
    box(game.playerX, 1.28f, game.playerZ, 0.35f, 0.22f, 0.33f, panel);
    box(game.playerX + 0.31f, 0.76f, game.playerZ - 0.11f, 0.12f, 0.14f, 0.12f, cyan);

    // Echoes: independent original faceted silhouettes with pulse cores.
    for (int32 i = 0; i < 2; i++)
    {
        const Echo& echo = game.echoes[i];
        float bob = 0.10f * sinf(game.time * 2.8f + echo.seed);
        box(echo.x, 0.54f + bob, echo.z, 0.62f, 1.08f, 0.44f, echoDark);
        box(echo.x, 1.22f + bob, echo.z, 0.42f, 0.34f, 0.38f, dark);
        box(echo.x, 0.74f + bob, echo.z - 0.24f, 0.17f, 0.22f, 0.08f, core);
    }

    // Beacon on the right foreground visibly pulses as a navigational prop.
    float beacon = 0.70f + 0.25f * sinf(game.time * 5.0f);
    box(7.9f, 0.65f, 8.7f, 0.85f, 1.30f, 0.85f, dark);
    box(7.9f, 1.42f, 8.7f, 0.55f, 0.24f + beacon * 0.16f, 0.55f, amber);

    renderPrimitiveEnd();
}

extern "C" {

EMSCRIPTEN_KEEPALIVE
int obsidian_relay_init(int32 width, int32 height)
{
    if (!game.ready)
    {
        renderInit();
        if (webContext <= 0 || webContextMakeCurrentResult != EMSCRIPTEN_RESULT_SUCCESS)
            return 0;
        game.ready = true;
        resetGame();
        glClearColor(0.015f, 0.025f, 0.035f, 1.0f);
    }
    game.width = width;
    game.height = height;
    renderResize(width, height);
    return 1;
}

EMSCRIPTEN_KEEPALIVE
void obsidian_relay_resize(int32 width, int32 height)
{
    if (!game.ready)
        return;
    game.width = width;
    game.height = height;
    renderResize(width, height);
}

EMSCRIPTEN_KEEPALIVE
void obsidian_relay_set_action(int32 action, int32 down)
{
    if (action >= 0 && action < ACTION_MAX)
        game.actions[action] = down != 0;
}

EMSCRIPTEN_KEEPALIVE
void obsidian_relay_interact()
{
    if (game.phase == PHASE_FAILED || game.phase == PHASE_COMPLETE)
        return;
    if (game.phase == PHASE_RESTORE && distSq(game.playerX, game.playerZ, 0.0f, -7.25f) < 2.2f * 2.2f)
        game.phase = PHASE_EXIT;
}

EMSCRIPTEN_KEEPALIVE
void obsidian_relay_restart()
{
    if (game.ready)
        resetGame();
}

EMSCRIPTEN_KEEPALIVE
void obsidian_relay_tick(float deltaSeconds)
{
    if (!game.ready)
        return;
    float dt = clampf(deltaSeconds, 0.0f, 0.05f);
    update(dt);
    // Keep the fixed-angle camera inside the playable hull. The earlier probe
    // framing placed it beyond the rear wall at spawn, which made the exterior
    // ceiling dominate the screen instead of the explored corridor.
    float cameraX = clampf(game.playerX + 5.8f, -7.6f, 7.6f);
    float cameraZ = clampf(game.playerZ + 2.4f, -10.2f, 10.3f);
    vec3i camera = {
        int32(cameraX * WORLD_SCALE), int32(-13.2f * WORLD_SCALE), int32(cameraZ * WORLD_SCALE)
    };
    vec3i target = {
        int32(game.playerX * WORLD_SCALE), 0, int32((game.playerZ - 2.4f) * WORLD_SCALE)
    };
    // The adapter’s projection takes 160 / `persp` as tan(FOV/2).
    // A larger value gives this fixed exploration camera a readable corridor
    // scale rather than the panoramic view used by the graphics probe.
    renderSetCamera(camera, target, 320);
    renderClear();
    renderStation();
    renderSwap();
}

EMSCRIPTEN_KEEPALIVE
int32 obsidian_relay_health()
{
    return int32(game.health + 0.5f);
}

EMSCRIPTEN_KEEPALIVE
int32 obsidian_relay_cells()
{
    return game.cellCount;
}

EMSCRIPTEN_KEEPALIVE
int32 obsidian_relay_phase()
{
    return int32(game.phase);
}

EMSCRIPTEN_KEEPALIVE
int32 obsidian_relay_prompt()
{
    if (game.phase == PHASE_FAILED)
        return 4;
    if (game.phase == PHASE_COMPLETE)
        return 5;
    if (game.phase == PHASE_RESTORE && distSq(game.playerX, game.playerZ, 0.0f, -7.25f) < 2.2f * 2.2f)
        return 1;
    if (game.phase == PHASE_RESTORE)
        return 2;
    if (game.phase == PHASE_EXIT && game.playerZ < -9.7f && fabsf(game.playerX) < 2.1f)
        return 3;
    return 0;
}

EMSCRIPTEN_KEEPALIVE
void obsidian_relay_shutdown()
{
    if (!game.ready)
        return;
    renderFree();
    game.ready = false;
}

} // extern "C"
