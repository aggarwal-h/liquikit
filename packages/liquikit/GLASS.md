# Glass

Cross-browser liquid glass built on a single SVG filter primitive,
`feDisplacementMap`. The content renders normally and the glass bends a picture
of it, so text under the lens stays selectable and links stay clickable. No
flags and no WebGL.

At rest, glass runs no filter at all: the browser's own backdrop blur frosts it
and its light is a baked image. The filter runs only while the glass is in use
(pressed, dragged, focused or growing), and on as little as it can: a
lens-sized copy of the backdrop of the nearest `GlassScope`, the page behind
through `backdrop-filter` in Chromium where there is no scope, or a copy of a
control's own track. See [What the glass bends](#what-the-glass-bends).

## Layout

| File | Role |
| --- | --- |
| `optics.ts` | The lens model: traces refraction to build the map |
| `motion.ts` | Springs, timings and the rubber band, shared by both controls |
| `glass.tsx` | The `<Glass>` primitive: filter chain, refraction source, rim |
| `backdrop.ts` | Whether this browser runs SVG filters in `backdrop-filter` |
| `scope.tsx` | `GlassScope`: the backdrop, and a pool of lens-sized copies of it for glass in use |
| `light.ts` | Bakes a light map into a transparent image, so resting glass is lit with no filter |
| `settle.ts` | Whether a pane is on screen and the page has stopped scrolling, for glass that always bends |
| `presets.ts` | Lens profiles per surface (light/dark) and per component |
| `use-squish.ts` | Velocity-driven squash and stretch, area preserving |
| `use-glass-*.ts` | Headless motion: geometry, lens values and drag, no state |
| `glass-*-surface.tsx` | The control drawn, owning no state and no role |
| `glass-switch.tsx` / `glass-slider.tsx` / `glass-segmented.tsx` | Batteries-included bindings on native form controls |
| `glass-toggle-group.tsx` | Pressable toggles, any number lit at once; the segmented surface with `aria-pressed` semantics |
| `glass-pane.tsx` | Glass with content on top: what buttons, toolbars, tab bars and menus are made of |
| `../` | The component set on `@base-ui/react`: every Base UI component, in glass (see "The whole of Base UI" below) |

Nothing here imports from the host app, so the folder installs as one registry
item, `glass`, and depends only on `motion`.

## Resting vs open

At rest the lens body is a solid capsule: `tintOpacity` is 1 and the glass is
closed, so the control reads as a plain white pill with a soft resting shadow.
Pressing or dragging fades the tint to 0, grows the lens, and swaps the resting
shadow for the lifted one. The refraction is a response to touch, not a
permanent decoration; leaving the glass open all the time is the most common way
to get this wrong.

## The lens model

`optics.ts` models the glass instead of painting an effect. It traces a
viewing ray through a glass body: the ray refracts at the curved top surface by
Snell's law, crosses the thickness, and lands on the content plane underneath.
The gap between entry and landing is the displacement.

The model is deliberately simple. The viewer looks straight down, the ray
refracts once at the top surface, the content is a flat plane under the glass,
and the result is baked into an 8-bit map. The lighting below is a shading
model laid over the bent view, not light traced through the scene.

Because the model is physical, the controls describe a material rather than an
effect (`ior` and `thickness` are a real substance and a real shape), and the
things that otherwise have to be tuned by hand come out on their own:

- **The rim** is a fillet `bevel` pixels wide and `thickness` tall. Its steep
  slope bends the view inward, which is what reads as the edge of a thick
  piece of glass. It can sit on a slab `base` pixels deep. Without one the
  glass thins to nothing at the outline and bends least right at the edge; on
  one, the light still has glass to cross there, so the hardest bend lands at
  the very edge and folds a mirrored view of the middle into it.
- **The magnification** comes from the top, which is not flat. Domed, it
  enlarges what is underneath, taken about the capsule's long axis the way a
  glass rod enlarges a line lying beneath it; dished, below 1, it shrinks it.
  A switch's knob is dished, because Apple's is: through it the track reads
  about 0.8 of its height, with the page showing above and below. A slider's
  handle and a toggle group's glass are flat, at 1, so the track and the labels
  show through at their own size.
- **The rim light** is Schlick's Fresnel term. Glass gets more reflective
  towards grazing angles, so the rim brightens by itself: `rimLight` all the
  way round, plus the brighter half of the surroundings (`environment`) on
  rims that face the top of the screen.
- **The glints** are a Blinn lobe for the key light and a weaker one on the
  opposite rim (`backLight`), where the same light catches again after
  reflecting once inside the glass.
- **The shade** is the darker half of the surroundings on rims that face
  down. Light glass on a light page is lit rather than shaded, so `rimShadow`
  keeps it faint; turned up, it reads as a plastic button rather than glass.

Light and shade come out as one signed value per pixel. They are drawn as a
grey image of their own and blended over the bent view by hard-light: mid-grey
leaves it alone, lighter screens on, so a highlight lifts any colour towards
white the way a reflection adds to what is behind it, and darker multiplies
in.

`dispersion` is the one knob that is deliberately unphysical. Real crown glass
splits red from blue by about 1%, which is invisible at this size, so the
spread is exaggerated, but the *ordering* stays honest: blue bends further
than red, because the index rises towards the blue end. It only applies to the
rim, so it fringes the edge of the glass and nothing inside it.

The rim's height depends only on distance from the outline, so the whole trace
collapses onto one axis: it is tabulated once across the rim band and then
steered by the outline's gradient at each pixel. That is what keeps a full
regeneration at roughly 2ms, comfortably inside a frame.

## How it works

The lens is one map and one light image. The map's red and green channels say
how far a pixel bends horizontally and vertically (the rim and the dome
together), with 128 neutral and everything outside the outline laid over
neutral, so only the region under the glass moves. Its blue channel is the
outline itself, how much of each pixel the lens covers, which the frost is cut
to. The light image is the rim's light and shade as hard-light grey (see
above).

The map bends in one displacement pass. A lens whose `dispersion` is above 0
uses three at slightly different strengths, which split the rim's colour
into a fringe. The dome's small pull is quantised against the rim's
larger range in the one map, about an eighth of a pixel a step on a tab bar's
lens, which nothing that moves shows.

The maps are drawn at the lens's own size and the screen's density (at least
2 map pixels per CSS pixel, at most 8, and never more than `mapSize` along the
longer side), so they land on the lens without being stretched. The outline is
anti-aliased: pixels it only partly covers fade towards neutral. And the dish
hands over to the rim across the outer half of the bevel, so nothing bends at
the very edge and the two never meet at a seam.

A flat top's map and light are cut in three along the longer side: the two
ends as drawn, and a one-pixel stretch between them that the filter draws out
again. Nothing on a flat top changes along a straight edge, so only the ends
and that one line are ever worked out. See "What it costs a frame".

What the dish bends is smoothed before the rim sees it. In Chromium and WebKit
a displacement copies the nearest source pixel, so an enlarged image comes out
in blocks (a 2× dome turns every pixel into a 2×2 square, and every curve
into stairs), and a shrunk one skips pixels. A 3×3 binomial kernel over
the result blends across them the way smooth image scaling would; `softness`
blends that kernel with doing nothing. Two things that look like they should
work and do not:

- **feGaussianBlur.** Every engine runs it as box blurs of whole pixels, so
  below about a pixel it does nothing, and the next step up is already a heavy,
  banded blur. A convolution works on the device-pixel grid.
- **Smoothing the source instead.** A convolution that reads the page itself
  costs Chromium about 10ms a frame; this one reads only the bent lens and
  costs nothing measurable.

Firefox is left out. Its displacement does not step, and smoothing it again
only blurs everything the lens shows.

The primitives work in user space: plain pixels of the layer being filtered.
Under `objectBoundingBox`, `feDisplacementMap`'s `scale` is resolved
differently by every engine: Firefox takes the box's normalised diagonal,
Chromium its width, and WebKit its width and height separately. No single
number bends all three the same; pixels do.

Whatever is refracted has to line up exactly with the real content: the lens
does the magnifying, and any difference between the two shows as a seam where
the glass meets the track. So the copy is the real track again, same size,
same place, and never a scaled stand-in.

## What the glass bends

Each `<Glass>` picks when it mounts where its filter runs while it is in use.
It changes its mind only once, out of `backdrop` (see below).

| Mode | Runs on | Used by |
| --- | --- | --- |
| `lens` | A copy of the `GlassScope` backdrop, cut to the lens, through `filter` | Glass in a scope: panes in every browser, switches, sliders and segmented controls in Safari and Firefox |
| `backdrop` | The page behind, through `backdrop-filter: url(#…)` | Switches, sliders and segmented controls in Chromium; panes with no scope in Chromium |
| `copy` | `refractionTarget`, a copy of the control's own content on a see-through layer, lit by the baked light as it opens | Switches, sliders and segmented controls on other glass, or with no scope in Safari and Firefox |
| `none` | Nothing: the glass keeps its frosted, lit look | Panes on other glass; panes with no scope in Safari and Firefox |

GPU-composited Chromium (real Chrome on a Mac, not the headless builds tests
run in) does not hold an SVG `backdrop-filter` with other glass behind it: on
any frame the filter is not itself rebuilt, which is any frame something else on
the page paints, it drops it, and the glass flickers between bent and flat. A
tab bar's lens over the bar did, every few frames while it moved or was held. So
a surface inside other glass bends its own copy, and a pane in a scope bends the
scope's copy even in Chromium: both are ordinary `filter`s, which Chromium
holds.

Where there is no scope, as with a menu portalled to the end of the page,
Chromium still bends the backdrop. There the frost is drawn inside the lens's own
filter, cut to its outline, rather than as a CSS blur on a layer of its own,
so each glass is one backdrop filter rather than two stacked. The outline
comes from the map's alpha: the layer's rounded `clip-path` does not cut a
backdrop filter's output on that path, which nothing showed until the filter
changed anything outside the lens. At rest the backdrop filter comes off and
the CSS frost takes over again.

A backdrop filter reads the page only up to the nearest backdrop root: an
ancestor with opacity, a filter, a backdrop filter, a mask, a clip-path or a
blend mode. Under one it gets that ancestor's own see-through paint over
nothing, and Chromium draws the whole box dark. A frosted card does it, and so
does a fade-in that fills forwards, which holds the root even once it rests on
an opacity of 1. So each time a backdrop glass opens it looks for one, and if
it finds one it drops for good to what Safari and Firefox would use: the
scope's copy, its own copy, or, for a pane, no bend at all.

### Scopes

Safari and Firefox cannot hand an element a live picture of what is behind it.
So the glass bends a copy of it. Pass the background to a `GlassScope`:

```tsx
<GlassScope backdrop={<img src="/photo.jpg" alt="" className="size-full object-cover" />}>
  <Button>Play</Button>
</GlassScope>
```

The scope draws it behind its children, then keeps a pool of small
boxes, each holding a second copy of it, laid out and empty at rest. A pane in
use borrows one, moves it under its lens, sizes it to the lens and however far
the filter reaches, and runs its filter on it. When the pane settles it hands
the box back.

Why a copy, and why so small:

- **Filtering anything that holds other glass breaks it.** The first version
  put the filter on the scope itself. Safari and Firefox paint an element with
  an SVG filter, and everything inside it, in software, and the backdrop blur
  of every other pane inside came out wrong: pressing one button made all the
  others flicker. The copy sits under the glass, so nothing else is inside it.
- **Safari and Firefox run SVG filters on the CPU, per pixel.** A card-sized
  filter held a pressed button to 49fps in Safari and a toggling switch to 36;
  the lens-sized box holds both at 60. Cropping the filter's region instead
  does not work in WebKit (below), and clipping the element does not save
  Safari any work.
- **The box is laid out before it is needed.** Showing a hidden copy on the
  first press cost Safari 77ms that frame; a box that is already laid out at
  zero size costs 25–40ms, and less for a light backdrop such as gradients.

What it asks of the backdrop:

- **Draw it cheaply.** It is rendered again under every pane that bends it.
  Photos and gradients cost little; SVG artwork with blur filters of its own
  costs Safari tens of milliseconds a copy, and a video would play once per
  copy.
- **The copy starts from the scope's own background.** Its colour and images
  are copied under it, so a translucent backdrop over a solid scope covers
  the original instead of doubling it. A backdrop that is translucent all the
  way down, over whatever the page has behind the scope, still doubles inside
  the box while the glass is in use.

### Detecting the backdrop

Detection cannot use `CSS.supports`, which only checks syntax: `url()` is
valid in `backdrop-filter` whether or not the engine renders it. Only Chromium
renders it, and only Chromium exposes `navigator.userAgentData`, so the brand
list is the test. The first paint is always the resting look, which needs no
mode: the server cannot know the browser.

## Motion

Everything is a spring rather than a timed curve. The lens already behaves like
a physical object, and a spring keeps that consistent: interrupt a gesture
mid-flight and the motion carries its velocity through instead of restarting a
fixed duration. `TRAVEL` carries the handle, `OPEN` is faster than `CLOSE` so a
press feels answered, and the glass opens the moment a pointer lands rather
than after a delay.

The squash conserves area (a drop of liquid does not gain volume by being
thrown), so the lens narrows and grows taller by reciprocal factors. Speed maps
onto squash through a saturating curve with one meaningful number, the speed at
which the effect is most of the way in, rather than an exponent to guess at.

A knob squashes as it picks up speed, narrower and taller. A capsule crossing
a row, such as a segmented control's pill or a tab bar's lens, stretches along its
travel instead, wider and flatter and a quarter as far (`speedSquash` in
`useSquish`). Squashed the knob's way, a big lens sent across a tab bar
bulged 20px above and below the bar mid-flight and snapped wide as it
stopped, which read as a shake rather than as liquid.

Resistance past the end of a track is hyperbolic rather than polynomial: the
pull approaches its limit and never reaches it, so there is no point where the
give suddenly stops.

### Liquid

`liquid`, 0 to 1 on every control, is what makes the glass read as liquid
rather than rubber. It defaults to `DEFAULT_LIQUID`, 0.6, which is meant to be
felt more than seen, the way Apple keeps it. 0 turns it off, and reduced motion
turns it off too.

- **The wobble.** Pressing a control makes its glass ring on a spring of its
  own, about 3.5 times a second and well short of critically damped: it lifts
  off the track taller and narrower, answers back a little wider, and has
  settled in about a third of a second. Letting go lands it flatter, the
  other way round, and so does coming to a sudden stop: a squash collapsing
  quickly throws the shape past round. Width and height swing against each
  other with the area held, so the glass jiggles without swelling. At 1 the
  first swing is about 5%; at the default, about 3%.
- **The lag.** While the glass moves, what it shows trails it along the
  direction of travel (by up to 3px at 1, about 1.5px at the default), then
  springs back, overshooting by a fraction of a pixel, when it stops. It is
  one `feOffset` at the head of the filter, sliding the view before the dome
  and the rim bend it; the page around the lens is drawn from the untouched
  source. The toggle group leaves it out: its glass is flat and sits on
  labels, and a label that slid inside the capsule would read as a glitch.

Neither redraws a map. The wobble is well inside the 12% a held map can be
stretched, and the lag moves nothing but the view. What it costs is time: the
glass keeps animating a few hundred milliseconds after a stop or a release,
and each of those frames is a filter pass like any frame of motion. Measured
over a drag, the lag pass adds under a millisecond a frame in Chromium, inside
the noise of the measurement. Deliberately absent: ripples through the
refraction itself, which would need a new map every frame, and which Apple
does not do either.

The switch and slider derive their handle the same way (twice the handle's
height), so a longer track gains travel rather than a fatter handle. A toggle
group measures its options instead, and the lens resizes as it springs between
them.

The switch's pressed glass is sized from the track rather than scaled from the
thumb, to match Apple's: 1.45 times the track's height, half again as wide as
it is tall, and a true capsule whatever the squash does to it. It overhangs the
track above and below, which is what lets the page show through around the
track. It holds that shape while pressed and only stretches when thrown; the
slider still squeezes slightly while held. A segmented control's pill grows by
the same amount both ways when pressed, so it lifts off the track evenly.

## What the lens body is for

Every control works the way Apple's do: at rest the lens is a solid object,
and the glass only opens under a press. A switch's knob and a slider's handle
are plain capsules. A segmented control's pill carries its selected label on
the body's `face`, a layer laid out where the row is, cut to the lens as it
moves, and faded with the body. So at rest it is a white pill with a dark
label on it.

A press lifts the pill into clear glass over the real row, bent the same way
as everything else: through `backdrop-filter` in Chromium, and a copy of the
row in Safari and Firefox or inside other glass. The glass crosses to a new choice,
or follows a drag from the chosen option, and settles back into a pill where
it lands. It stays open for 340ms after a press or a change, long enough to
travel as glass and arrive as a pill.

A tab bar's pill all but fills the bar, and `pressScale` lifts it into a lens
about one and a half times its height. That is taller than the bar, so held
or dragged the glass overhangs the bar above and below, as Apple's does. It
also keeps the rim off the icons: a lens no bigger than the bar has its rim on
the icons and labels, and folds slivers of them into its edge that jump about
as the glass grows and wobbles.

Text is far less forgiving than a fill. The pill's lens is flat on top, so the
labels under it keep their size and place, and has no colour split. Its rim
sits on a thinner slab than the slider's, so its edge bends the empty track
above and below the labels rather than folding the labels into itself as
slivers of mirrored text.

## Panes

A knob is a solid object that opens into glass under a press. A pane is the
other kind of glass: open all the time, with content on top of it, such as a
button's label, a toolbar's icons or a menu's items. `GlassPane` is that
surface. It sizes itself from its content and lays a lens the size of its box
under it, with room around it for a shadow and a press to grow into.

Apple has two materials, and so does the pane. `regular` is frosted: a 14px
blur, saturation lifted to 1.8 and half a white tint, so what sits on it reads
over any backdrop. `clear` is almost bare glass, for small controls over
images. The frost is a layer of its own under the tint: opacity scales an
element's backdrop blur along with everything else, so a blur on the
half-transparent tint came out as half a blur, with the page behind showing
through sharp.

A pane's light is the lens's own light map baked into a transparent image
(`light.ts`): the map is blended hard-light, which over any colour is the same
as painting white above mid-grey and black below it at |2L − 1|, so the bake is
exact and plain CSS draws it. The baked light sits over the tint, as the filter's
light did when it ran over the whole scope, and it is always on, so the filter a
pane runs has no light pass of its own. Its frost stays the browser's own
backdrop blur, on the GPU: drawn inside the lens filter it was a 14px blur the
CPU redid every frame of a press in Safari and Firefox.

A pane bends only while it is in use: while its `press` is above 0.3, which is
a press or a field's focus but not a hover, while a `shape` moves, and for
900ms after either. It never bends when it sits on other glass, where a button
on a card would only be seen through the card's frost. Its lens is flat, with a narrow rim
on a thin slab, so its content is never bent: the bend is only ever in the last
few pixels of the edge.

Bending every resting pane in a scope, each over its own lens-sized copy, was
tried as the default and dropped: it brought the true look back, but every
resting pane then carried a filter, and pages felt heavy again. It remains as
`refraction="always"`. Safari and Firefox draw filters on the CPU and throw a
layer's picture away when it scrolls out of view, so there such a pane takes
its lens only while it is within 120px of the viewport and once the page has
stopped scrolling for 160ms, one pane a frame (`settle.ts`), and gives it back
once it leaves the screen.

A press grows the pane by a tenth of its height each way and lights its tint,
with the same wobble as everything else. A `shape` draws the lens somewhere
other than the pane's own box, and cuts the content to the lens as drawn,
wobble and all. `frost`, 0 to 1, clears the material towards bare glass: the
blur scales with it, and the tint keeps a third of itself so the glass still
reads as a surface.

A lens under a solid body cannot be seen, so while the body is solid the copy
and the backdrop pane are hidden outright. That spares Chromium a backdrop
pass on every resting switch and slider, and keeps a see-through body, such as a tab
bar's soft pill, from showing a resting lens through it.

### The menu morph

A menu opens the way Apple's do, after a screen recording of iOS 26. It opens
over its button, and the button's glass becomes the menu:

1. The button's capsule pulls in to a round droplet, a little taller than the
   button, and the button steps aside (it is still there, at opacity 0, so
   focus can come back to it).
2. The droplet flies to where the panel goes, carrying a little past it and
   back. It is clear glass in flight, lit a little the way a pressed control
   is, so the page bends through it.
3. It inflates into the panel a beat behind. The axis it travels along swells
   first, drawing it out along the way; the other follows later and softer,
   so the two overshoot about 5% out of step, height then width, and it lands
   like jelly. The corners stay round until the last moment, and the frost
   comes in as it lands.
4. The content shows through as the panel fills: blurred and a little small,
   sharpening into place as the glass settles.

Every part is a spring given as a duration and a bounce, the way SwiftUI's
are, rather than as stiffness and damping. A frame-by-frame fit to the
recording came out quick (full in about 0.2s) and read as snappy rather
than fluid on screen, so it is a little looser than the recording: the panel
arrives in about 0.3s, overshoots at about 0.4s and has settled by about
0.6s.

Closing runs it backwards, quicker and with less bounce, in about 0.25s. The
glass lands in the button still carrying some of its way, so the button,
glass and label together, gives about 8% of its height in the direction the
glass was travelling, down into it when the menu opened above, and springs
back into place in about 0.4s. It keeps its size, as Apple's does. The lens
itself moves, rather than the button being transformed: a scope's lens box is
placed by layout, and a transform would leave it behind. `landGlass(element,
direction)` sets that off on any pane, or on anything holding one. Base UI unmounts a
popup once the animations running on it finish, so a do-nothing animation on
`visibility` holds it until the droplet has settled into the button's
capsule. The button comes back, and the popup goes, in the same frame. It is
not an opacity animation: opacity below 1 makes the pane a backdrop root,
and the glass would lose the page behind it for as long as it ran.

With the menu over its button, the press that opened it ends over an item.
Base UI chooses an item a press is dragged to and let go on, after 200ms, so
a slow click would choose whatever landed under the pointer. A release within
a few pixels of where the press went down is taken as the click on the button
ending; press, drag to an item and let go still chooses it. A popover opens
beside its button instead, which stays put while the droplet buds off it.

### Overlays

The select, the alert and the toast are made of the same morph. Where a menu
grows out of its button, `MorphPane`'s `origin` says what else a popup can
grow from:

| Component | Grows from | |
| --- | --- | --- |
| Select | `trigger` | Apple's pop-up button: opens over its button like the menu, a checkmark on the chosen item, the list at least as wide as the button |
| Alert | `centre` | A small copy of the panel, a third its size, swells in place; it draws back into a point closing, over a page dimmed a little |
| Toast | `top` | A small capsule at the panel's top edge widens and drops, unfolding into it the way a notification comes out of the Dynamic Island, and folds back up |

Grown from a seed there is no button to lift off, so the glass swells at once,
both ways nearly together (the second a frame behind, so they still
overshoot out of step), and nothing lights or wobbles the way a press would.
A first version started the alert as a round droplet that sat still for a few
frames and grew taller before it grew wider; it read as odd rather than
liquid. There is no button to land in either, so a seeded popup closes by
shrinking to nothing where it came from and goes as soon as it is gone.

Toasts are stacked by hand, not by layout: each is placed below the ones
above it by their measured heights and slides there on a spring, down as a
new one arrives on top and up as one above goes. One on its way out stops
taking up room at once, so the rest close the gap while it folds away. Laid
out in a column, the older toasts jumped down in a single frame.

The sheet is not a morph. It is one pane of glass on Base UI's `Drawer`,
carried up from the bottom on a spring and down by a drag, so its glass is
drawn once and moved rather than redrawn. The spring is sampled into a
`linear()` easing so a CSS transition can run it. A finger can pull the sheet
down from anywhere on it; a mouse only by the strip along its top, because
Base UI leaves mouse drags on a sheet's content to text selection. A short
pull springs back, a long one or a flick puts it away, and the page's dimming
lifts as it goes.

The search field is a capsule pane around Base UI's `Input`. It lifts and
lights a little while it has focus, the way a pressed control does, and its
clear button springs in once there is text. Clearing sets the value the way
typing would, so a controlled field, a `Field` and a form all hear it.

`Button` gained `block`, for the full-width buttons in a sheet and an alert.

### The whole of Base UI

Every Base UI component has a glass counterpart in `../`, except the two
that draw nothing (`CSPProvider`, `DirectionProvider`):

| Kind | Components | In glass |
| --- | --- | --- |
| Buttons | `Button`, `Toggle`, `Toolbar` | A pane that swells and lights under a press; a toggle is `prominent` while on |
| Choices | `Switch`, `Checkbox`, `CheckboxGroup`, `Radio`, `RadioGroup`, `SegmentedControl`, `ToggleGroup`, `Slider` | Knobs and pills of glass; a checkbox or radio is a small drop that fills with the accent, its tick drawing itself in |
| Fields | `Input`, `SearchField`, `NumberField`, `OtpField`, `Field`, `Fieldset`, `Form` | Slabs and capsules of glass that lift a little while focused and turn red when invalid; the number field is Apple's stepper with the value in it, its label scrubbable |
| Pickers | `Select`, `Combobox`, `Autocomplete` | A field or pop-up button whose list buds off it and reshapes as typing filters it |
| Menus | `Menu`, `ContextMenu`, `Menubar`, `NavigationMenu` | The menu morph; submenus open beside their row, a context menu grows from where the pointer was, a navigation menu's one panel reshapes between titles |
| Overlays | `Popover`, `PreviewCard`, `Tooltip`, `Dialog`, `Alert`, `Sheet`, `Toast` | Grown out of their trigger, or from a seed where there is none |
| Content | `Tabs`, `Accordion`, `Collapsible`, `Avatar`, `Meter`, `Progress`, `ScrollArea`, `Separator` | A slab of glass that grows with its sections on a spring; sunken frosted capsules with glossy fills for bars; a thin frosted scrollbar |

The bars are frosted rather than refracting: a bar is a few pixels tall,
all of it within reach of a lens's rim, and when a lens bent the whole of it,
the fill's end came out jagged.

Two things were added to the morph for these. `origin="point"` grows a
context menu from a droplet where the pointer was, which its root keeps in
`PopupState.point`. And once open, the glass follows its panel's size (a
list that filters, a navigation panel easing between contents) through a
`ResizeObserver` that tells the shape where the panel now is, frame by frame.

A menu opens over its button on its own, below its title in a menubar, and
beside its row as a submenu: `MenuPlacement` carries that default down.

A menubar's menus share one panel of glass, as a navigation menu's content
does. Moving from one title to the next, the menu closing hands its glass
over (where it is, its size and its corners) through the `Handoff` context
and goes at once. The menu opening takes the glass from there: it
eases across and reshapes into its own panel on one spring, still frosted,
its items fading in as it moves. Whichever of the two React commits first,
the handover meets in the next frame. A menu that was handed the glass goes
home to its own title when it finally closes. Submenus take no part.

Growing a pane's room, as a morph does to reach where its glass starts,
re-renders it with a new origin, and the glass is drawn in that same commit,
before the pane's effects run. `useDerived` works its value out during
render, as motion's `useTransform` does, so the glass sees the new origin
and is never drawn a frame against the old one.

Inside a marked area the glass filters everything in it, a pane's own
content included, so whatever lies within reach of a pane's rim is bent with
the page. On a bar that is the first and last items' hover bubbles and focus
rings: the toolbar, the menubar and the navigation bar leave 8px at their
ends, and draw their focus rings inside their items, to keep clear of it.

### Drawn in the frame it moves

The glass draws in motion's own frame loop, in its render step, so a value an
animation moves is drawn in the frame it moves. Drawing on a
`requestAnimationFrame` of its own left it a frame behind motion. It was
invisible on a knob, but a menu's content cut to the shape ran visibly ahead
of the glass.

The pane's lens geometry is worked out with `useDerived`, not `useTransform`.
`useTransform` defers its work to motion's next pre-render step, and a value
that has already run in a step is not queued again. Where two inputs share a
source, as a radius worked out from a width and a height that follow the same
spring, it can run between their two updates and keep the stale one: the lens
radius was a frame behind the rest of the lens, every frame. `useDerived`
works the value out the moment any input changes.

## Themes

Every surface takes a `theme`, `"light"` or `"dark"`. Left out, it takes the
nearest `GlassThemeProvider`'s, and light without one. So one provider at the
top of an app sets every control in it, and context carries it into the
portals that menus, dialogs and toasts open in. `useGlassTheme(theme)` is the
same lookup for a component of your own.

```tsx
<GlassThemeProvider theme="dark">
  <App />
</GlassThemeProvider>
```

Dark glass is a dark body (`--glass-pane-tint`, `#2a2a2e` for panes and
`#1b1b1f` for knobs and pills) under `darkLens`, whose rim catches more light
and sheds a deeper shadow. The glass bends whatever is behind it either way,
so dark glass wants something dark behind it; the demo's stages have a
night-time wallpaper for it.

The styles around the glass follow the theme through a handful of tokens in
`liquikit.css`: `--glass-ui-ink` is the colour of labels, captions, separators and
hover fills, given as channels (`0 0 0` or `255 255 255`) so each use picks its
own strength, alongside a few that are not ink: the danger red, a bar's well,
a backdrop's scrim and a checkbox's edge. They are set on the provider's element
(`data-glass-theme`, which takes no part in layout) and on every pane
(`data-theme`), so a pane in a portal is themed too, and a light pane inside a
dark app is light again.

`--glass-accent` is inherited: set it once, on the document so it reaches the
portals, and buttons, focus rings, checkboxes, tab bars and bars take it.
`--glass-accent-fill` does the same for the softer shade a switch's track and
a slider's run are filled with; left unset, they keep the glass's own iris.

Glass floating over other glass, such as a fixed header over the page, rests like
all glass, so it is steady. Outside a scope it bends through `backdrop-filter`
in Chromium while in use, which GPU Chromium does not hold steady over other
glass, so keep `refraction="always"` off such glass.

## The first paint

A server-rendered page is painted before any script runs (for a second or
two in dev), and everything above is drawn by script. So the first render
draws the resting state itself, and the frames take over from it:

- `<Glass>` works out where the lens body, its rims, its face and its copy sit
  from the values the control starts with, and renders them there. It takes
  them once, so a later render never writes over what the frames have drawn.
- The switch's and the slider's fills start from their values, through the
  root's `style`.
- A slider with no `width` fills its container, and cannot know its size until
  it measures it. Until then CSS draws the resting track, fill and handle
  across whatever width it has: the fill is a share of the track, not pixels,
  and the handle sits at its progress of the track less its own width. Once
  measured, a new width moves the handle with `jump`, which carries no
  velocity, so neither the travel spring nor the squash reads a resize as a
  throw.
- A segmented control cannot know where its options are until it measures
  them, so until then CSS draws the resting pill behind the chosen label.
- A pane cannot draw its glass until it knows its size, so until then CSS
  draws its frosted body: blur and shadow on one layer, tint over it. A pane
  with a `shape`, such as a popup, draws nothing until then: its box is not
  the shape it shows, and a popup that mounts at zero size would otherwise
  flash its full box for a frame when it is first measured.
- Tabs show the first tab until one is chosen. Pass `defaultValue` when the
  page is server-rendered, so the right panel is in the HTML too.

Without these, a reload showed grey switches, empty sliders, no pills and
buttons with no body until the page hydrated.

## What it costs a frame

Resting glass runs no filter, so a page of it scrolls like any page of frosted
panels. Glass in use runs one filter each, covering only its own lens. Chromium
sends each filter to its GPU process afresh every frame, as a tree rather than
a graph: every path through it to an image carries its own copy of the
image's pixels, and every step on the way runs again. So it is shaped for both
costs:

- **Bytes, on the page's compositor thread.** A whole map is the lens's full
  size at the screen's density. The rim's light and shade used to be worked
  out from the map in the filter, by a multiply and a screen that each read
  the bent view: four copies of the map on every path. Now the light is an
  image of its own, and a flat top's images are cut in three: a card's map is
  its two ends rather than the whole card.
- **Steps, on the GPU.** Each step costs about 15µs however small, so the graph
  is kept short: the map comes laid over neutral rather than composited onto
  it, the light is one blend rather than two passes, and the lens is laid
  straight over the page rather than cut out of it first: what a lens bends is
  always opaque, so there is nothing to cut.

Before resting glass stopped filtering, those changes took a page of 48 panes
scrolling in GPU Chromium on a 120Hz screen from dropping a third to a half of
its frames to dropping 2–4%.

The maps a press will need are built before it: a pane hands `<Glass>` its
focused and pressed shapes, and they are built, decoded and baked while the
page is idle. While the lens swells, the nearest map it already has (resting
or pressed) is stretched onto it, so a press builds no map mid-flight.

Where the pieces meet, an engine can leave the pixel between them empty when
the seam falls between pixels (WebKit does, and so does Chromium through
`backdrop-filter` while a popup moves by fractions of a pixel), and an empty
pixel in a map bends as far as the map allows. So every piece is opaque, the
stretch reaches a pixel into each end where it matches them, and the pieces lie
on ground (neutral under the map, mid-grey under the light) that reaches past
the lens: a pixel left empty anywhere bends nothing and lights nothing.

A looping animation keeps the browser drawing every frame too, so `Meter` and
`Progress` hold still while they are off screen: an indeterminate bar's glide
pauses, and a new value lands at once instead of springing.

## Cross-browser notes

- Safari caches SVG filter output by filter id, so the filter gets a fresh id
  on every update, or the glass freezes mid-motion.
- Safari loads an `feImage` href asynchronously. A filter can render once
  against a map that has not arrived yet and, if nothing else changes, never
  render again. That shows up as a held control losing its rim until you move
  it. `decodeMap` waits for the image and asks for one more pass.
- Lens shapes are snapped to 0.5px before the map is generated. Without that, a
  spring settling on a held control misses the cache every frame and rebuilds
  the whole PNG at 60fps.
- While the lens is moving, the last map is stretched onto the new shape (the
  filter scales it to the lens box anyway) until the shape drifts more than
  12% from what the map was drawn for, and the exact map is drawn once the
  shape has held still for 90ms. A one-second slider drag and its release
  rebuild the maps 7 times rather than 48, which also leaves Safari far
  fewer maps to load mid-motion. The maps are small enough at the lens's own
  size that those rebuilds spend under 2ms encoding PNGs in all.
- A new map goes into the filter only once the browser has decoded it; until
  then the last decoded one is stretched onto the shape. Swapped in while
  still decoding, Chromium bent garbage inside the lens for the frames it took
  to arrive. A tab bar's lens did it while growing through a few maps as it
  lifted.
- The rim and the dome share one map and one displacement pass (three for a
  lens that splits colour) rather than a map and a pass each.
- An `feImage` with no image is not a harmless blank. WebKit drops the whole
  filter over it, and Chromium draws the lens's edge differently. An uncut
  map fills all three of its pieces with the whole image instead.
- Chromium's GPU work for the lens grew sixfold while scrolling when the light
  was laid over the bent view without first being cut to where there is
  content: about 30ms a frame rather than 4.5. The cut does nothing to the
  picture over opaque content, and it stays.
- The backdrop path takes the same fresh id on every update, so both paths
  follow one rule.
- WebKit measures an HTML element's filter from its nearest *transformed*
  ancestor, not from the element itself, and from the
  page when nothing is transformed. Primitives then land in the wrong place, and an element whose filter
  misses it entirely is not drawn at all. Any transform on the element, even an
  identity one, makes its own box the origin, which is why the scope's lens
  boxes carry one. The copy already has one; it is scaled down from its
  supersampled size.
- WebKit also draws the whole filtered element shifted sideways when the
  filter *region* is given in user space, so the region stays a fraction of
  the element's box and only the primitives are in pixels.
- WebKit's displacement only reads from inside the primitive's own region. The
  rim only ever pulls inward, but a dish reads past the lens box, so the dish
  pass's region is grown by however far its map says it reaches.
- The three rim passes each keep one channel at full alpha, and the alpha of
  the middle pass is put back afterwards. Adding the passes up directly doubles
  the alpha of anything semi-transparent, which in a scope with no background
  of its own turns the lens black.
- Firefox keeps each primitive's result as a texture of its own and reads it
  back between pixels when the primitive's region falls between them. A lens
  springing to a size like 60.9px puts every region off the grid, and the view
  through it is resampled at every step of the graph and comes out soft. Every
  region, and the lag's offset, is snapped to whole device pixels; the other
  engines round regions onto the grid anyway.
- Firefox's displacement already comes out smooth, so the lens's own
  smoothing is left off there (`engine.ts`). With it on, everything inside the
  glass blurs.
- A rim on a thick base can pull from further in than a small lens is wide,
  and read out past the far side of it. The rim passes run as far out as the
  map says the rim reads, and everything they read from runs at least that far,
  because WebKit hands back nothing from outside a primitive's own region.
- WebKit still only honours `-webkit-user-select`. Without it, dragging a
  pill across its labels selects them, and the selection highlight paints
  over the row. Every surface sets both.
- Safari repaints part of a filtered element black when something over it
  changes and only that part is repainted: opening a menu over a card whose
  backdrop was filtered blacked out the menu's grid cell until something forced
  a full redraw. The lens box has a compositing layer of its own
  (`will-change: transform`), so nothing over it repaints it.
- An SVG filter on an element in Safari and Firefox takes the backdrop blur
  away from every glass inside it, which is why the filter never runs on an
  element that holds other glass.
- Safari has a ceiling on the source graphic a filter can process, so keep the
  refracted DOM small. The glass container is deliberately only a little larger
  than the control.
- Safari will not apply an SVG filter to a live `<video>`. That case needs the
  same map fed to a WebGL shader instead.

## Lens profile

`thickness`, `base`, `bevel` and `maxSlope` shape the rim, in lens pixels; `ior` and
`dispersion` are the material; `magnification` is the dome, `domeLength` its
shape and `softness` how much what it bends is smoothed; `environment`,
`rimLight`, `rimShadow`, `specularStrength`, `backLight`, `roughness` and the
light's angle and elevation are the lighting; `shadingStrength` weighs all of it
in the final image. `openTint` is how much of the body's fill stays over open
glass. The three shadows are plain CSS `box-shadow` values, and `"none"` turns
one off.

The slider's preset is fitted to the slider in Chris Feijoo's BeJS talk,
[Liquid Glass in the Browser: Refraction with CSS & SVG](https://www.youtube.com/watch?v=p1ORlG2dCK8),
measured from its displacement map: a squircle rim on a thick slab, whose bend is 63% of the glass's height at the edge and gone a fifth of the
way in, a flat top, no colour split, and a tenth of the body left over the
open glass. It is fitted to our handle's size, and the lens is in pixels, so a
much larger handle wants the rim scaled with it.

`domeLength` runs from 1, a dome swept the whole length of a capsule like a
glass rod, to 0, a round dome about the centre like a magnifying glass. A rod
enlarges only across the capsule, which suits a pill over a line of text but
stretches an icon and its label taller than wide: on a tab bar's nearly round
lifted lens, at 1.2×, that read as the content warping. The tab bar's lens is
a round dome at 1.12×, lightly smoothed (`softness` 0.3) so the enlarged
label stays sharp; smoothing is there for 1× screens, where magnifying without
it steps every edge.

Each surface starts from its own preset, such as `switchLens`, `sliderLens`,
`toggleLens` or `paneLens`, and a `lens` prop overrides fields of it.

## Geometry

Every component derives everything from its track, so a resized control keeps
its proportions.

| | Switch | Slider | Toggle group |
| --- | --- | --- | --- |
| Track | `74 × 28` | `container × 6` | `auto × 36` |
| Inset | `round(0.107 × h)` | none | `round(0.107 × h)` |
| Handle | `2 × thumbHeight` | `2 × thumbHeight` | measured per option |
| Pressed glass | `1.45h` tall, `1.5 : 1`, capsule | `1.4 ×` handle, capsule | `1.4 ×` pill height, grown evenly, capsule |
| Travel | `w - handle - 2 × inset` | `w - handle` | between option centres |

The slider's track is deliberately thin and its handle much taller, so the
capsule sits proud of the bar. The fill runs from empty at the minimum to the
whole track at the maximum, so its end is always under the handle: at the
handle's middle halfway along, at its far edge at either end. Ending at the
middle throughout would leave half a handle of bare track at the maximum, which
the solid knob hides but the open glass shows.
