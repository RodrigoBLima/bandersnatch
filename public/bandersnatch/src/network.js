class Network {
  constructor({ host }) {
    this.host = host;
  }

  parseManifestUrl({ url, fileResolutionTag, fileResolution, hostTag }) {
    return url
      .replace(fileResolutionTag, fileResolution)
      .replace(hostTag, this.host);
  }
  async fetchFile(url){
      const response = await fetch(url)
      return response.arrayBuffer()
  }
  async getProperResolution(url) {
    const starMs = Date.now();
    const response = await fetch(url);
    await response.arrayBuffer();
    const endMs = Date.now();

    const durationInMs = endMs - starMs;
    //  console.log('durationInMs',durationInMs)

    // CALC FOR TIME
    const resolutions = [
      { start: 3001, end: 20000, resolution: 144 }, // PIOR CENARIO POSSIVEL, 20 SEGUNDOS
      { start: 901, end: 3000, resolution: 360 }, // ATÉ 3 SEGUNDOS
      { start: 0, end: 900, resolution: 720 }, // MENOS DE 1 SEGUNDO
    ];

    const item = resolutions.find((item) => {
      return item.start <= durationInMs && item.end >= durationInMs;
    });

    const LOWEST_RESOLUTION = 144;

    if (!item) return LOWEST_RESOLUTION; // PARA MAIS DE 20S 

    return item.resolution;
  }
}
