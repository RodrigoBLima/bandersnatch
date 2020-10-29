class VideoMediaPlayer {
  constructor({ manifestJson, network, videoComponent }) {
    this.manifestJson = manifestJson;
    this.videoComponent = videoComponent;
    this.network = network;
    this.videoElement = null;
    this.sourceBuffer = null;
    this.selected = {};
    this.videoDuration = 0;
    this.activeItem = {};
    this.selections = {};
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

      setInterval(this.waitForQuestions.bind(this), 200);
    };
  }

  waitForQuestions() {
    const currentTime = parseInt(this.videoElement.currentTime);

    const option = this.selected.at === currentTime;

    if (!option) return;

    if (this.activeItem.url === this.selected.url) return; // EVITAR QUE O MODAL APAREÇA 2X OU MAIS

    this.videoComponent.configureModal(this.selected.options);

    this.activeItem = this.selected;
  }

  async fileDownload(url) {
    const fileResolution = await this.currentFileResolution();

    const prepareUrl = {
      url,
      fileResolutionTag: this.manifestJson.fileResolutionTag,
      fileResolution,
      hostTag: this.manifestJson.hostTag,
    };
    const finalUrl = this.network.parseManifestUrl(prepareUrl); // console.log('finalUrl',finalUrl)

    this.setVideoPlayerDuration(finalUrl);

    const data = await this.network.fetchFile(finalUrl);

    return this.processBufferSegments(data);
  }

  nanageLag(selected) {
    if (!!~this.selections.indexOf(selected.url)) {
      selected.at += 5;
      return;
    }
    this.selections.push(selected.url);
  }

  setVideoPlayerDuration(finalUrl) {
    const bars = finalUrl.split("/");

    const [name, videoDuration] = bars[bars.length - 1].split("-");

    this.videoDuration = parseFloat(videoDuration);
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

  async currentFileResolution() {
    const LOWEST_RESOLUTION = 144;

    const prepareUrl = {
      url: this.manifestJson.finalizar.url,
      fileResolution: LOWEST_RESOLUTION,
      fileResolutionTag: this.manifestJson.fileResolutionTag,
      hostTag: this.manifestJson.hostTag,
    };

    const url = this.network.parseManifestUrl(prepareUrl);
    return this.network.getProperResolution(url);
  }

  async nextChunk(data) {
    const key = data.tolowerCase();
    const selected = this.manifestJson[key];

    this.selected = {
      ...selected,
      // AJUSTA O TEMPO QUE O MODAL VAIA APARECER
      at: parseInt(this.videoElement.currentTime + selected.at),
    };

    this.nanageLag(this.selected);
    // DEIXA O RESTANDTE DO VIDEO RODAR ENQUANTO BAIXA O NOVO VIDEO
    this.videoElement.play();
    await this.fileDownload(selected.url);
  }
}
