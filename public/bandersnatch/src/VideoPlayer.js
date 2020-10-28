class VideoMediaPlayer {
  constructor({ manifestJson, network }) {
    this.manifestJson = manifestJson;
    this.network = network;
    this.videoElement = null;
    this.sourceBuffer = null;
    this.selected = {};
    this.videoDuration = 0;
  }

  initializeCodec() {
    this.videoElement = document.getElementById("vid");

    const mediaSourceSupported = !!window.MediaSource;

    if (!mediaSourceSupported) {
      alert("Seu navegador não tem suporte ao MSE");
      return;
    }
    const codecSupported = MediaSource.isTypeSupported(this.manifestJson.codec);
    if (!codecSupported) {
      alert(
        `Seu navegador não tem suporte ao codec: ${this.manifestJson.codec}`
      );

      return;
    }

    const mediaSource = new MediaSource();

    this.videoElement.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener(
      "sourceopen",
      this.sourceOpenWrapper(mediaSource)
    );
  }
  sourceOpenWrapper(mediaSource) {
    return async (_) => {
      // console.log('sourceOpenWrapper')
      this.sourceBuffer = mediaSource.addSourceBuffer(this.manifestJson.codec);

      const selected = (this.selected = this.manifestJson.intro);

      mediaSource.duration = this.videoDuration;

      await this.fileDownload(selected.url);
    };
  }

  async fileDownload(url) {
    const prepareUrl = {
      url,
      fileResolutionTag: this.manifestJson.fileResolutionTag,
      fileResolution: 360,
      hostTag: this.manifestJson.hostTag,
    };
    const finalUrl = this.network.parseManifestUrl(prepareUrl); // console.log('finalUrl',finalUrl)

    this.setVideoPlayerDuration(finalUrl);

    const data = await this.network.fetchFile(finalUrl);

    return this.processBufferSegments(data)
  }
  setVideoPlayerDuration(finalUrl) {
    const bars = finalUrl.split("/");

    const [name, videoDuration] = bars[bars.length - 1].split("-");

    this.videoDuration = videoDuration;
  }

  async processBufferSegments(allSegments) {
    const sourceBuffer = this.sourceBuffer;
    sourceBuffer.appendBuffer(allSegments);

    return new Promise((resolve, reject) => {
      const updateEnd = (_) => {
        sourceBuffer.removeEventListener("updateend", updateEnd);

        sourceBuffer.timestampOffset = this.videoDuration;

        return resolve();
      };

      sourceBuffer.addEventListener("updateend", updateEnd);
      sourceBuffer.addEventListener("error", reject);
    });
  }
}
