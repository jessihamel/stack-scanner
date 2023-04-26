# Stack Scanner

Stack Scanner is a small web app that allows you to scan through a stack of .tif files and filter by pixel values. It was built as a tool to help with ink detection in 3D x-ray scans of ancient papyrus as part of the [Vesuvius Challenge](https://scrollprize.org/).

<img src="https://raw.githubusercontent.com/jessihamel/stack-scanner/main/screenshot.png" alt="Screenshot">

## Running the app

Stack Scanner is a React frontend with a node backend. You'll need a relatively up to date version of [node](https://nodejs.org/en) to run the server. To start the app, run the following command in the root directory.

```bash
npm run server
```

In your browser, go to [http://localhost:5000/](http://localhost:5000/) to view the app.

## Adding your own .tif files to scan

This repo has example .tif files, but you'll want to bring your own data.

NB: Stack Scanner works with both 16bit or 8bit .tif files. It has only been tested on monochrome .tif files like the fragment files for the Vesuvius Challenge, but you'll get better performance if you downsample these. There's a utility script to do this for you at scripts/downsample.js. Running `npm run downsample` will resize your images to 2000 pixel wide .tiffs.

To add your own files:

1. Replace the .tif images in `./img` with your own
2. Run `npm run createReference` in the root directory. This creates lower resolution .jpg copies of your images to use as reference images in the application. These images are created in the `.img/reference` directory.
3. If you have a single reference .png you'd like to toggle as an overlay (eg. a hand-labeled ink binary mask), replace the image at `./reference/overlay.png`

## Developing

By default, the server runs at localhost:5000 and serves the built version of the app in ./build. If you'd like to make changes to the client code, you'll want to run the development server by running `npm run start` and going to [http://localhost:3000/](http://localhost:3000/)

## Contributing

Pull requests and feature requests are welcome.

## License

[MIT](https://choosealicense.com/licenses/mit/)
