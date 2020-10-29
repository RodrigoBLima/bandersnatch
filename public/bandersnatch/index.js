const MANIFEST_URL = "manifest.json";
const localHost = ["127.0.0.1", "localhost"];

async function main() {
  //   console.log("main");
  const isLocal = !!~localHost.indexOf(window.location.hostname);
  //   console.log("isLocal", isLocal);
  const manifestJson = await (await fetch(MANIFEST_URL)).json();

  const host = isLocal ? manifestJson.localHost : manifestJson.productionHost;

  const videoComponent = new VideoComponent();
  const network = new Network({ host });
  const videoPlayer = new VideoMediaPlayer({
    manifestJson,
    network,
    videoComponent,
  });

  videoPlayer.initializeCodec();

  videoComponent.initializePlayer();

  window.nextChunk = (data) => videoPlayer.nextChunk(data);
}

window.onload = main;
