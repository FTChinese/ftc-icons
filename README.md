## Install
`bower install ftc-icons`

If you specify `inludePaths: 'bower_components'` in `node-sass`, just import the `main.scss` file below:

    @import "ftc-icons/main.scss"

To see the icons list and effects, run:

    gulp serve

## Usage

FTC-ICONS uses `src/*.svg` files as source to build datauri, png and sprite.

### Use Default Icon as Datauri

    ftcIconGetIconDatauri($icon-name)

returns `url(encoded-svg-data-uri)`.

### Custom Icon fill color and backgkround color

FTC icons, together with icons produced by FT is turned into sass functions and mixins with `gulp-sassvg` under `scss` folder. You can import `scss/_sassvg.scss` and use its function `sassvg()` or mixin `@include sassvg` in you sass file.

#### `sassvg()` function
Currently you could not use `gulp-sassvg` on svg icons with more than one color since `gulp-sassvg` will turn every occurrence of `fill:color` in your svg into its own template `fill:#{$fillcolor}`. This means when you pass in an argument to `$color` or `$fillcolor`, every path in the gernerated svg datauri have this color. As long as you svg has only one color, this works quite good. By default all fillcolors you added to the src svg will be erased when turn into `_sassvg-data.css`.

    sassvg($icon, 
        $color: $sassvg--color, 
        $fillcolor: $color,
        $strokecolor: $color, 
        $opacity: 1,
        $extrastyles: "",
        $url: $sassvg--url
    )

Let's say you want to use the `svg/hamburger.svg`, you can do it this way:

    background-image: sassvg(hamburger);

If your icons are drawn on a transparent canvas with the path filled. You can change it for compiled results:

    background-image: sassvg(hamburger, $fillcolor: #fff, $extrastyles: "background-color:" + #FFCC99);

`$extrastyles` will be set on the `<svg>` element, thus the style will be applied to the entire canvas. `$fillcolor` will be set on `<svg>` and every occurrence of `fill` on the `<path>` element (See why it doesn't work when you used more than one color on the icon?). 

### Use SVG files directly

Minified SVG icons is under the folder `build/svg`.

### Use PNG files directly

PNG files are generated from SVGs, put into `build/png`.

### Use PNG sprite

`sprite/icons.sprite.png` is a sprite concatenated from individual PNGs which are first generated from SVGs after scaling. `sprite/icons.sprite.png.css` is the css file generated together with the sprite. When using png sprite, you should also link to this css file.

### Use `<symbol>` SVG

You can use a sprited svg file `sprite/sprite.symbol.svg`. This file combines all the separate svg icons and put each in a `symbol` element, each having an `id` which is the same as the individual svg file name (without the `.svg` extension). In you HTML makrup, you can insert icons needed with id fragment:

	<svg>
		<use xlink:href="ftc-dist/icons/sprite.symbol.svg#brand-ftc" />
	</svg>

## Develop

The project has a submodule `o-ft-icons`. You need to recursively clone:

    git clone --recursive https://github.com/FTChinese/ftc-icons.git

To build your own icons, put you svg icons in `src` directory, run `gulp serve` for live view. Generated files are put into `.tmp` directory. Run `gulp build` for release.

## Gulp Commands

`gulp sassvg` will generate sass files named `_sassvg-data.scss` and `_sassvg.scss` under the folder `scss`. You can customize icons' fill color and background color.

`gulp svg2css` generates a sass file under `scss` folder containing functions of the same name as svg file name. Every function returns an encoded data uri return a string `url(encoded-svg-data-uri)`.

`gulp svgsymbol` put individual SVG into a `symbol` element and concatenate them into a single SVG file.

`gulp svgmin` minifies the original SVGs.

`gulp svg2png` generate PNGs from SVGs. As you may need PNGs of different size, this task could be divided into several sub-tasks, each having a different scaling facter before generating the files.

`gulp rsvg` is just an alternative to `svg2png`.




