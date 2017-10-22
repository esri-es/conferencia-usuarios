# Before start

Kudos to :

- [@hakimel](https://github.com/hakimel) for [reveal.js](https://github.com/hakimel/reveal.js/)
- [@mattdesl](https://github.com/mattdesl) for [svg-mesh-3d](https://github.com/mattdesl)
- [@mrdoob](https://github.com/mrdoob) for [threejs](https://github.com/mrdoob/three.js)
- [@unconed](https://github.com/unconed) for [PixelFactory](acko.net/files/gltalks/pixelfactory/online.html)
- [@spacegoo](https://twitter.com/spacegoo) for [webgl academy](http://www.webglacademy.com/)
- [@greggman](https://github.com/greggman) for [webgl fundamentals](https://github.com/greggman/webgl-fundamentals)
- [@beauty_pi](https://twitter.com/beauty_pi) for [Shadertoy](https://www.shadertoy.com/)
- And all the people referenced in this presentation for such an awesome work ! You Rock!



# Requirements

Have node installed.

I always recommend [nvm](https://github.com/creationix/nvm) , it lets you have several versions of node in your computer.


# Instructions

Install a cli static-server 

```bash
npm i -g http-server
git clone https://github.com/esri-es/conferencia-usuarios.git
cd conferencia-usuarios/2017/webgl_que_es_y_por_que_es_importante_ce17
```

Launch "ocean" webgl slide in background

```bash
http-server iframe_examples/shadertoy-in-three-js/ -p 9999 &
```

Launch the slides
```bash
http-server .
```


If you want to play with the examples, go to [iframe_examples](iframe_examples) and follow the instructions of each project described in README.md file.
