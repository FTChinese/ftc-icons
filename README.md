#Install
`bower install ftc-icons`

Generated files were put into `ftc-dist` directory.

`gulp serve` for live preview.

#Usage
FTC-ICONS uses `ftc/*.svg` files as source to build datauri, png and sprite.

## Use SVG Datauri

SVG files are turned into datauri as sass variables in the partial file `ftc-dist/ftc/_sass-var.scss`. Each variable is named after the original SVG files. To use them, import `ftc-dist/_icons.scss`, which imports this file, in your scss file and write scss rules like `background-image: $social-wechat`.

## Use SVG files directly

Minified SVG icons is under the folder `ftc-dist/icons/svg`.

## Use PNG files directly

PNG files are generated from SVGs, put into `ftc-dist/icons/png`.

## Use PNG sprite

`ftc-dist/icons/icons.sprite.png` is a sprite concatenated from individual PNGs which are first generated from SVGs after scaling. `ftc-dist/icons/icons.sprite.png.css` is the css file generated together with the sprite. When using png sprite, you should also link to this css file.

## Use `<symbol>` SVG

You can use a sprited svg file `dist/icons/sprite.symbol.svg`. This file combines all the separate svg icons and put each in a `symbol` element, each having an `id` which is the same as the individual svg file name (without the `.svg` extension). In you HTML makrup, you can insert icons needed with id fragment:

	<svg>
		<use xlink:href="ftc-dist/icons/sprite.symbol.svg#brand-ftc" />
	</svg>

## SVG Polyfill
If you want to use SVGs while support old browsers without using png as fallback, [SVG for Everybody](https://github.com/jonathantneal/svg4everybody) is recommended.

# Use FT Icons
Icons produced by FT is turned into sass functions and mixins with `gulp-sassvg` and under `ftc-dist/ft` folder which has already been imported into `ftc-dist/_icons.scss`. You also can import `ftc-dist/ft/_sassvg.scss` and use its function `sassvg()` or mixin `@include sassvg` in you sass file.

## `sassvg()`
Currently you could not use `gulp-sassvg` on svg icons with more than one color since `gulp-sassvg` will turn every occurrence of `fill:color` in your svg into its own template `fill:#{$fillcolor}`. This means when you pass in an argument to `$color` or `$fillcolor`, every path in the gernerated svg datauri have this color. As long as you svg has only one color, this works quite good. Therefore we did not use it on FTC icons due to the multiple colors used by Sina Weibo.

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

By default most FT icons are drawn on a transparent canvas with a black fill color. You can change it for compiled results:

    background-image: sassvg(hamburger, $fillcolor: #fff, $extrastyles: "background-color:" + #FFCC99);

`$extrastyles` will be set on the `<svg>` element, thus the style will be applied to the entire canvas. `$fillcolor` will be set on `<svg>` and every occurrence of `fill` on the `<path>` element (See why it doesn't work when you used more than one color on the icon?). 

# Custom
To build your own icons, put you svg icons in `ftc/svg`, run `gulp dist`. All individual svgs, scss file of datauri, svg sprite, png fallback, and png sprite will be generated.

#Gulp Commands

`gulp sassvg` will generate sass mixins and function under the folder `ftc/sassvg`. You can customize icons' color.

`gulp svg2css` generates a sass file with variables as used by
[Use Datauri](#use-svg-datauri).

`gulp svgsymbol` put individual SVG into a `symbol` element and concatenate them into a single SVG file.

`gulp svgmin` minifies the original SVGs.

`gulp svg2png` generate PNGs from SVGs. As you may need PNGs of different size, this task could be divided into several sub-tasks, each having a different scaling facter before generating the files.

`gulp rsvg` is just an alternative to `svg2png`.

`gulp sprite:png` combines PNGs into a sprite. Since binary files do not support stream, a lot of intermediary files will be used in this process.




