ASSETSFOLDER=assets/timeline

for mediaFile in `ls $ASSETSFOLDER | grep .mp4`; do
    # echo $mediaFile

    # CORTAR EXTENSAO E RESOLUÇÃO
    FILENAME=$(echo $mediaFile | sed -n 's/.mp4//p' | sed -n 's/-1920x1080//p')
    # echo $FILENAME
    INPUT=$ASSETSFOLDER/$mediaFile
    FOLDER_TARGET=$ASSETSFOLDER/$FILENAME

    mkdir -p $FOLDER_TARGET

    # AQUIVOS DE RESOLUCOES DIFERENTES NA PASTA
    OUTPUT=$ASSETSFOLDER/$FILENAME/$FILENAME
    DURATION=$(ffprobe -i $INPUT -show_format -v quiet | sed -n 's/duration=//p')
    echo $DURATION

    OUTPUT144=$OUTPUT-$DURATION-144
    OUTPUT360=$OUTPUT-$DURATION-360
    OUTPUT720=$OUTPUT-$DURATION-720

    echo "RENDERING IN 144P"
    ffmpeg -y -i $INPUT \
        -c:a aac -ac 2 \
        -vcodec h264 -acodec aac \
        -ab 128k \
        -movflags frag_keyframe+empty_moov+default_base_moof \
        -b:v 300k \
        -maxrate 300k \
        -buffersize  300k \
        -vf "scale=-256:144" \ 
        # -v quiet \
        $OUTPUT144.mp4

    echo "RENDERING IN 360P"
    ffmpeg -y -i $INPUT \
        -c:a aac -ac 2 \
        -vcodec h264 -acodec aac \
        -ab 128k \
        -movflags frag_keyframe+empty_moov+default_base_moof \
        -b:v 400k \
        -maxrate 400k \
        -buffersize 400k \
        -vf "scale=-1:360" \ 
        # -v quiet \
        $OUTPUT360.mp4

    echo "RENDERING IN 720P"
    ffmpeg -y -i $INPUT \
        -c:a aac -ac 2 \
        -vcodec h264 -acodec aac \
        -ab 128k \
        -movflags frag_keyframe+empty_moov+default_base_moof \
        -b:v 150k \
        -maxrate 150k \
        -buffersize 1000k \
        -vf "scale=-1:720" \ 
        # -v quiet \
        $OUTPUT720.mp4

done