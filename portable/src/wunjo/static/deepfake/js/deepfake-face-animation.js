function sendDataToDeepfake(elem) {
  // If process is free
  fetch("/synthesize_process/")
    .then((response) => response.json())
    .then((data) => {
      // Call the async function
      processAsyncDeepfake(data, elem)
        .then(() => {
          console.log("Start to fetch msg for deepfake");
        })
        .catch((error) => {
          console.log("Error to fetch msg for deepfake");
          console.log(error);
        });
    });
}

async function processAsyncDeepfake(data, elem) {
  if (data.status_code === 200) {
    var synthesisDeepfakeTable = document.getElementById(
      "table_body_deepfake_result"
    );

    var messageDeepfake = elem.querySelector("#message-deepfake");
    messageDeepfake.innerHTML = "";

    var previewDeepfakeImg = elem.querySelector("#previewDeepfakeImg");

    var canvasRectangles = previewDeepfakeImg.querySelector("#canvasDeepfake");
    var canvasRectanglesList = [];
    if (canvasRectangles) {
      canvasRectanglesList = JSON.parse(canvasRectangles.dataset.rectangles);
    }

    var imgDeepfakeSrc = previewDeepfakeImg.querySelector("img");
    var videoDeepfakeSrc = previewDeepfakeImg.querySelector("video");
    var mediaName = "";
    var mediaBlobUrl = "";
    var typeFile = "";

    if (imgDeepfakeSrc) {
      typeFile = "img";
      mediaBlobUrl = imgDeepfakeSrc.src;
      mediaName = "image_" + Date.now() + "_" + getRandomString(5);
    } else if (videoDeepfakeSrc) {
      typeFile = "video";
      mediaBlobUrl = videoDeepfakeSrc.src;
      mediaName = "video_" + Date.now() + "_" + getRandomString(5);
    } else {
      var messageSetP = await translateWithGoogle(
        "Вы не загрузили изображение. Нажмите на окно загрузки изображения.",
        "auto",
        targetLang
      );
      messageDeepfake.innerHTML = `<p style='margin-top: 5pt;'>${messageSetP}</p>`;
    }
    if (mediaBlobUrl) {
      fetch(mediaBlobUrl)
        .then((res) => res.blob())
        .then((blob) => {
          var file = new File([blob], mediaName);
          uploadFile(file);
        });
    }

    var audioDeepfakeSrc = elem.querySelector("#audioDeepfakeSrc");
    var audioName = "";
    if (audioDeepfakeSrc) {
      var audioBlobUrl = audioDeepfakeSrc.querySelector("source").src;
      audioName = "audio_" + Date.now();
      fetch(audioBlobUrl)
        .then((res) => res.blob())
        .then((blob) => {
          var file = new File([blob], audioName);
          uploadFile(file);
        });
    } else {
      var messageSetP = await translateWithGoogle(
        "Вы не загрузили аудиофайл. Нажмите на кнопку загрузить аудиофайл.",
        "auto",
        targetLang
      );
      messageDeepfake.innerHTML = `<p style='margin-top: 5pt;'>${messageSetP}</p>`;
    }

    var cover = elem.querySelector("#cover-deepfake");
    var resize = elem.querySelector("#resize-deepfake");
    var full = elem.querySelector("#full-deepfake");
    var preprocessing = "full";
    if (cover.checked) {
      preprocessing = "cover";
    } else if (resize.checked) {
      preprocessing = "resize";
    }

    var still = elem.querySelector("#still-deepfake");
    var enhancer = elem.querySelector("#enhancer-deepfake");
    if (enhancer.checked) {
      enhancer = "gfpgan";
    } else {
      enhancer = false; // TODO need to set false (not RestoreFormer)
    }

    if (canvasRectanglesList.length === 0) {
      messageDeepfake.innerHTML +=
        "<p style='margin-top: 5pt;'>Вы не выделили лицо. Нажмите на кнопку выделить лицо и выделите лицо на изображении.</p>";
    }

    // advanced settings
    var expressionScaleDeepfake = elem.querySelector(
      "#expression-scale-deepfake"
    );
    var inputYawDeepfake = elem.querySelector("#input-yaw-deepfake");
    var inputPitchDeepfake = elem.querySelector("#input-pitch-deepfake");
    var inputRollDeepfake = elem.querySelector("#input-roll-deepfake");
    var backgroundEnhancerDeepfake = elem.querySelector(
      "#background-enhancer-deepfake"
    );
    var videoStartValue = elem.querySelector("#video-start").value;

    // Experimental parameters
    const experimentalEmotionDeepfake = elem.querySelector("#emotion-fake");
    var selectedEmotionDeepfake =
      experimentalEmotionDeepfake.options[
        experimentalEmotionDeepfake.selectedIndex
      ].value;
    if (selectedEmotionDeepfake === "null") {
      selectedEmotionDeepfake = null;
    }

    var similarCoeffFace = elem.querySelector("#similar-coeff-face").value;

    if (mediaName && audioName && canvasRectanglesList.length > 0) {
      const buttonAnimationWindows = document.querySelector(
        "#button-show-voice-window"
      );
      buttonAnimationWindows.click();

      var predictParametersDeepfake = {
        face_fields: canvasRectanglesList,
        source_image: mediaName,
        driven_audio: audioName,
        preprocess: preprocessing,
        still: still.checked,
        enhancer: enhancer,
        expression_scale: expressionScaleDeepfake.value,
        input_yaw: inputYawDeepfake.value,
        input_pitch: inputPitchDeepfake.value,
        input_roll: inputRollDeepfake.value,
        background_enhancer: backgroundEnhancerDeepfake.checked,
        type_file: typeFile,
        video_start: videoStartValue,
        emotion_label: selectedEmotionDeepfake,
        similar_coeff: similarCoeffFace,
      };

      synthesisDeepfakeTable.innerHTML = "";

      fetch("/synthesize_deepfake/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(predictParametersDeepfake),
      });

      const closeIntroButton = document.querySelector(".introjs-skipbutton");
      closeIntroButton.click();
    }
  } else {
    var synthesisDeepfakeTable = document.getElementById(
      "table_body_deepfake_result"
    );

    var messageDeepfake = elem.querySelector("#message-deepfake");
    var messageSetP = await translateWithGoogle(
      "Процесс занят. Дождитесь его окончания.",
      "auto",
      targetLang
    );
    messageDeepfake.innerHTML = `<p style='margin-top: 5pt;'>${messageSetP}</p>`;
  }
}

function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  fetch("/upload_tmp", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      console.log("File uploaded");
    })
    .catch((error) => {
      console.error(error);
    });
}

// ANIMATE WINDOWS //
function deepfakeGeneralPop(
  button,
  audio_url = undefined,
  audio_name = undefined
) {
  var audioInputField = `
                          <div class="uploadOuterDeepfakeAudio" style="margin-top: 10pt;margin-bottom: 10pt;display: flex;">
                            <label id="uploadAudioDeepfakeLabel" for="uploadAudioDeepfake" class="introjs-button" style="text-align: center;width: 100%;padding-right: 0 !important;padding-left: 0 !important;padding-bottom: 0.5rem !important;padding-top: 0.5rem !important;">Загрузить аудио</label>
                            <input style="width: 0;" accept="audio/*" type="file" onChange="dragDropAudioDeepfakeFaceAnimation(event)"  ondragover="drag(this.parentElement)" ondrop="drop(this.parentElement)" id="uploadAudioDeepfake"  />
                            <div id="previewDeepfakeAudio"></div>
                          </div>
                         `;

  if (audio_url) {
    var request = new XMLHttpRequest();
    request.open("GET", audio_url, true);
    request.responseType = "blob";
    request.onload = function () {
      var audioInputLabel = document.getElementById("uploadAudioDeepfakeLabel");
      audioInputLabel.textContent =
        audio_name.length > 20 ? audio_name.slice(0, 20) + "..." : audio_name;

      var audioInputButton = document.getElementById("uploadAudioDeepfake");
      audioInputButton.disabled = true;

      var audioBlobMedia = URL.createObjectURL(request.response);
      var audioPreview = document.getElementById("previewDeepfakeAudio");
      audioPreview.innerHTML = `
          <button id="audioDeepfakePlay" class="introjs-button" style="display:inline;margin-left: 5pt;">
            <i class="fa fa-play"></i>
            <i style="display: none;" class="fa fa-pause"></i>
          </button>
          <audio id="audioDeepfakeSrc" style="display:none;" controls="" preload="none">
            <source src="${audioBlobMedia}">
            Your browser does not support audio.
          </audio>
        `;
      var playBtn = document.getElementById("audioDeepfakePlay");
      var audio = document.getElementById("audioDeepfakeSrc");
      // Set audio length on the text element
      // Wait for metadata to be loaded
      audio.onloadedmetadata = function () {
        // Set audio length on the text element
        var audioLength = document.getElementById("audio-length");
        audioLength.innerText = audio.duration.toFixed(1); // rounded to 2 decimal places
      };

      playBtn.addEventListener("click", function () {
        if (audio.paused) {
          audio.play();
          playBtn.children[0].style.display = "none";
          playBtn.children[1].style.display = "inline";
        } else {
          audio.pause();
          playBtn.children[0].style.display = "inline";
          playBtn.children[1].style.display = "none";
        }
      });

      audio.addEventListener("ended", function () {
        playBtn.children[0].style.display = "inline";
        playBtn.children[1].style.display = "none";
      });
    };
    request.send();
  }

  var introDeepfake = introJs();
  introDeepfake.setOptions({
    steps: [
      {
        element: button,
        title: "Панель анимации",
        position: "left",
        intro: `
                    <div id="face-animation-main-windows" style="width: 250pt;columns: 2;display: flex;flex-direction: row;justify-content: space-around;">
                    <div style="width: 200pt;">
                        <div class="uploadOuterDeepfake">
                            <div style="flex-direction: row;display: flex;margin-bottom: 10pt;justify-content: space-between;">
                                <button class="introjs-button" style="display: none;margin-right: 5pt;" id="clearButton">Очистить</button>
                                <button style="width: 100%;display: none;" class="introjs-button" id="drawButton" data-controlval="get-face">Выделить лицо</button>
                            </div>
                            <span id="previewDeepfakeImg" class="dragBox" style="height: 200pt;justify-content: center;">
                              Загрузить изображение или видео
                            <input accept="image/*,video/*" type="file" onChange="dragDropImgOrVideo(event, 'previewDeepfakeImg', 'canvasDeepfake', this, 'clearButton', 'drawButton');handleMetadataAnimationFace(event);"  ondragover="drag(this.parentElement)" ondrop="drop(this.parentElement)" id="uploadFileDeepfake"  />
                            </span>
                        </div>

                        <fieldset id="fieldset-control-duration" style="display: none; padding: 5pt;margin-top: 10pt; ">
                            <legend></legend>
                            <div style="justify-content: space-between; margin-top: 5pt; margin-bottom: 5pt; display: flex;">
                              <label for="video-start">Старт видео (сек) </label>
                              <input type="number" title="Введите число" id="video-start" name="expression-scale" min="0" max="0" step="0.1" value="0" style="border-width: 2px;border-style: groove;border-color: rgb(192, 192, 192);background-color: #fff;padding: 1pt;width: 60pt;">
                            </div>
                            <div style="justify-content: space-between; margin-top: 5pt; margin-bottom: 5pt; display: flex;"><text>Длительность аудио (сек) </text><text id="audio-length">0</text></div>
                            <div style="justify-content: space-between; margin-top: 5pt; margin-bottom: 5pt; display: flex;"><text>Длительность видео (сек) </text><text id="video-length">0</text></div>
                        </fieldset>

                        ${audioInputField}
                    </div>
                    <div id="face-animation-parameters-windows" style="width: 200pt;display: none;">
                        <fieldset id="fieldset-preprocessing" style="padding: 5pt;">
                            <legend>Выбор препроцессинга</legend>
                            <div style="display: none;">
                              <input type="radio" id="cover-deepfake" name="preprocessing_deepfake" value="crop">
                              <label for="cover-deepfake">Crop</label>
                            </div>
                            <div>
                              <input type="radio" id="resize-deepfake" name="preprocessing_deepfake" value="resize">
                              <label for="resize-deepfake">Изменить размер</label>
                            </div>
                            <div>
                              <input type="radio" id="full-deepfake" name="preprocessing_deepfake" value="full" checked>
                              <label for="full-deepfake">Без изменений</label>
                            </div>
                        </fieldset>
                        <div id="still-deepfake-div" style="padding: 5pt;margin-top:5pt;">
                          <input type="checkbox" id="still-deepfake" name="still">
                          <label for="still-deepfake">Отключить движение головой</label>
                        </div>
                        <div style="padding: 5pt;">
                          <input type="checkbox" id="enhancer-deepfake" name="enhancer">
                          <label for="enhancer-deepfake">Улучшение лица</label>
                        </div>
                        <div id="similar-coeff-face-div" style="justify-content: space-between;padding: 5pt; display: flex;">
                          <label for="similar-coeff-face">Похожесть лица</label>
                          <input type="number" title="Введите число" id="similar-coeff-face" name="similar-coeff" min="0.1" max="3" step="0.1" value="1.2" style="border-width: 2px;border-style: groove;border-color: rgb(192, 192, 192);background-color: #fff;padding: 1pt;width: 60pt;">
                        </div>
                        <fieldset style="margin-top:10pt;padding: 5pt;border-color: rgb(255 255 255 / 0%);">
                          <legend><button style="background: none;border: none;font-size: 12pt;cursor: pointer;text-decoration" onclick="document.getElementById('advanced-settings').style.display = (document.getElementById('advanced-settings').style.display === 'none') ? 'block' : 'none';this.parentElement.parentElement.style.borderColor = (this.parentElement.parentElement.style.borderColor === 'rgb(192, 192, 192)') ? 'rgb(255 255 255 / 0%)' : 'rgb(192, 192, 192)';">Продвинутые настройки</button></legend>
                          <div id="advanced-settings" style="display:none;">
                            <div id="expression-scale-deepfake-div" style="justify-content: space-between;padding: 5pt; display: flex;">
                              <label for="expression-scale-deepfake">Выраженность мимики</label>
                              <input type="number" title="Введите число" id="expression-scale-deepfake" name="expression-scale" min="0.5" max="1.5" step="0.05" value="1.0" style="border-width: 2px;border-style: groove;border-color: rgb(192, 192, 192);background-color: #fff;padding: 1pt;width: 30pt;">
                            </div>
                            <div id="input-yaw-deepfake-div" style="padding: 5pt;">
                              <label for="input-yaw-deepfake">Угол поворота по XY</label>
                              <input type="text" pattern="[0-9,]+" oninput="this.value = this.value.replace(/[^0-9,-]/g, '');" title="Введите числа через запятую" id="input-yaw-deepfake" name="input-yaw" style="width: 100%;border-width: 2px;border-style: groove;border-color: rgb(192, 192, 192);background-color: #fff;padding: 1pt;">
                            </div>
                            <div id="input-pitch-deepfake-div" style="padding: 5pt;">
                              <label for="input-pitch-deepfake">Угол поворота по YZ</label>
                              <input type="text" pattern="[0-9,]+" oninput="this.value = this.value.replace(/[^0-9,-]/g, '');" title="Введите числа через запятую" id="input-pitch-deepfake" name="input-pitch" style="width: 100%;border-width: 2px;border-style: groove;border-color: rgb(192, 192, 192);background-color: #fff;padding: 1pt;">
                            </div>
                            <div id="input-roll-deepfake-div" style="padding: 5pt;">
                              <label for="input-roll-deepfake">Угол поворота по ZX</label>
                              <input type="text" pattern="[0-9,]+" oninput="this.value = this.value.replace(/[^0-9,-]/g, '');" title="Введите числа через запятую" id="input-roll-deepfake" name="input-roll" style="width: 100%;border-width: 2px;border-style: groove;border-color: rgb(192, 192, 192);background-color: #fff;padding: 1pt;">
                            </div>
                            <div style="padding: 5pt;" id="background-enhancer-deepfake-message">
                              <input type="checkbox" id="background-enhancer-deepfake" name="background-enhancer">
                              <label for="background-enhancer-deepfake">Улучшение фона (долго)</label>
                            </div>
                            <div style="padding: 5pt;" id="use-experimental-functions-message">
                                <input onclick="document.getElementById('deepfake-emotion').style.display = this.checked ? 'block' : 'none';" type="checkbox" id="use-experimental-functions" name="experimental-functions">
                                <label for="use-experimental-functions">Экспериментальная версия</label>
                                <div id="deepfake-emotion" style="margin-top: 10pt; margin-bottom: 10pt;display: none;">
                                    <label for="emotion-fake">Выберите эмоцию</label>
                                    <select id="emotion-fake" style="margin-left: 0;border-width: 2px;border-style: groove;border-color: rgb(192, 192, 192);background-color: #fff;padding: 1pt;width: 100%;margin-top: 5pt;">
                                        <option value="null" selected>Not use</option>
                                        <option value="0">Angry</option>
                                        <option value="1">Disgust</option>
                                        <option value="2">Fear</option>
                                        <option value="3">Happy</option>
                                        <option value="4">Neutral</option>
                                        <option value="5">Sad</option>
                                    </select>
                                    <i style="font-size: 10pt;"><b>Примечание:</b> <a>Находится на стадии исследования и представлена исключительно для демонстрации.</a></i>
                                </div>
                            </div>
                            <a style="padding: 5pt;" href="https://github.com/wladradchenko/wunjo.wladradchenko.ru/wiki" target="_blank" rel="noopener noreferrer">Подробнее о настройках</a>
                          </div>
                        </fieldset>
                        <p id="message-deepfake" style="color: red;margin-top: 5pt;text-align: center;font-size: 14px;"></p>
                        <button class="introjs-button" style="background: #f7db4d;margin-top: 10pt;text-align: center;width: 100%;padding-right: 0 !important;padding-left: 0 !important;padding-bottom: 0.5rem !important;padding-top: 0.5rem !important;" onclick="sendDataToDeepfake(this.parentElement.parentElement);">Синтезировать видео</button>
                    </div>
                    </div>
                    `,
      },
    ],
    showButtons: false,
    showStepNumbers: false,
    showBullets: false,
    nextLabel: "Продолжить",
    prevLabel: "Вернуться",
    doneLabel: "Закрыть",
  });
  introDeepfake.start();
  availableFeaturesByCUDA(
    document.getElementById("background-enhancer-deepfake-message")
  );
  document
    .getElementById("video-start")
    .addEventListener("change", function () {
      var videoElement = document.querySelector("#previewDeepfakeImg video"); // get the video element inside the preview
      if (videoElement) {
        var startTime = parseFloat(this.value); // get the value of the input and convert it to a float
        videoElement.currentTime = startTime; // set the video's current playback time to the start time
      }
    });
}

/// GENERAL DRAG AND DROP ///
function handleMetadataAnimationFace(event) {
  const file = event.target.files[0];
  document.getElementById("face-animation-main-windows").style.width = "450pt";
  document.getElementById("face-animation-parameters-windows").style.display = "inline";

  if (file.type.includes("image")) {
    document.getElementById("fieldset-preprocessing").style.display = "block";
    document.getElementById("still-deepfake-div").style.display = "block";
    document.getElementById("expression-scale-deepfake-div").style.display = "block";
    document.getElementById("input-yaw-deepfake-div").style.display = "block";
    document.getElementById("input-pitch-deepfake-div").style.display = "block";
    document.getElementById("input-roll-deepfake-div").style.display = "block";

    document.getElementById("similar-coeff-face-div").style.display = "none";
    document.getElementById("use-experimental-functions-message").style.display = "none";

    handleImageMetadataAnimationFace("fieldset-control-duration");
  } else if (file.type.includes("video")) {
    document.getElementById("fieldset-preprocessing").style.display = "none";
    document.getElementById("still-deepfake-div").style.display = "none";
    document.getElementById("expression-scale-deepfake-div").style.display = "none";
    document.getElementById("input-yaw-deepfake-div").style.display = "none";
    document.getElementById("input-pitch-deepfake-div").style.display = "none";
    document.getElementById("input-roll-deepfake-div").style.display = "none";

    document.getElementById("similar-coeff-face-div").style.display = "block";
    document.getElementById("use-experimental-functions-message").style.display = "block";

    // You can use a Promise or setTimeout to wait until the metadata is loaded
    const video = document.createElement("video");
    video.setAttribute("src", URL.createObjectURL(file));
    video.onloadedmetadata = function () {
      handleVideoMetadataAnimationFace(video, "fieldset-control-duration");
    };
  }
}

function handleVideoMetadataAnimationFace(video, fieldsetControlId) {
  const fieldsetControl = document.getElementById(fieldsetControlId);
  const audioLength = document.getElementById("audio-length").innerText;

  if (audioLength !== "0") {
    fieldsetControl.style.display = "block";
  } else {
    fieldsetControl.style.display = "none";
  }

  const videoLength = document.getElementById("video-length");
  videoLength.innerText = video.duration.toFixed(1);

  const videoInputLength = document.getElementById("video-start");
  let videoMaxLength;
  if (video.duration.toFixed(1) > 0.1) {
    videoMaxLength = video.duration.toFixed(1) - 0.1;
  } else {
    videoMaxLength = video.duration.toFixed(1);
  }
  videoInputLength.setAttribute("max", videoMaxLength.toString());
  videoInputLength.value = 0;
}

function handleImageMetadataAnimationFace(fieldsetControlId) {
  const fieldsetControl = document.getElementById(fieldsetControlId);
  fieldsetControl.style.display = "none";

  const videoLength = document.getElementById("video-length");
  videoLength.innerText = 0;

  const videoInputLength = document.getElementById("video-start");
  videoInputLength.setAttribute("max", "0");
  videoInputLength.value = 0;
}

function dragDropImgOrVideo(
  event,
  previewId,
  canvasId,
  uploadFileElem,
  clearButtonId,
  drawButtonId
) {
  var file = event.target.files[0];
  var uploadFileId = uploadFileElem.id;
  // Getting the video length

  var reader = new FileReader();
  reader.onload = async function (e) {
    let dimensions;
    var preview = document.getElementById(previewId);
    var widthPreview = parseFloat(preview.style.width);
    var heightPreview = parseFloat(preview.style.height);
    if (widthPreview > heightPreview) {
      var maxPreviewSide = widthPreview;
    } else {
      var maxPreviewSide = heightPreview;
    }
    var uploadFileElemOuterHTML = uploadFileElem.outerHTML;

    if (file.type.includes("image")) {
      dimensions = await loadImage(e);
      var aspectRatio = dimensions.width / dimensions.height;
      if (dimensions.width >= dimensions.height) {
        preview.style.width = maxPreviewSide + "pt";
        preview.style.height = maxPreviewSide / aspectRatio + "pt";
        dimensions.element.setAttribute("width", "100%");
        dimensions.element.setAttribute("height", "auto");
      } else {
        preview.style.width = maxPreviewSide * aspectRatio + "pt";
        preview.style.height = maxPreviewSide + "pt";
        dimensions.element.setAttribute("width", "auto");
        dimensions.element.setAttribute("height", "100%");
      }
      dimensions.element.style.objectFit = "cover";
      preview.innerHTML = `<canvas style="position: absolute;" id=${canvasId}></canvas>`;
      preview.appendChild(dimensions.element);
    } else if (file.type.includes("video")) {
      dimensions = await loadVideo(e);
      var aspectRatio = dimensions.width / dimensions.height;
      if (dimensions.width >= dimensions.height) {
        preview.style.width = maxPreviewSide + "pt";
        preview.style.height = maxPreviewSide / aspectRatio + "pt";
        dimensions.element.setAttribute("width", "100%");
        dimensions.element.setAttribute("height", "auto");
      } else {
        preview.style.width = maxPreviewSide * aspectRatio + "pt";
        preview.style.height = maxPreviewSide + "pt";
        dimensions.element.setAttribute("width", "auto");
        dimensions.element.setAttribute("height", "100%");
      }
      dimensions.element.setAttribute("preload", "metadata");
      dimensions.element.style.objectFit = "cover";
      preview.innerHTML = `<canvas style="position: absolute;"  id='${canvasId}'></canvas>`;
      preview.appendChild(dimensions.element);
    }
    preview.innerHTML += uploadFileElemOuterHTML; // set prev parameters of upload input

    // DRAW RECTANGLES //
    var canvasField = document.getElementById(canvasId);
    var clearButton = document.getElementById(clearButtonId);
    var drawButton = document.getElementById(drawButtonId);
    drawButton.style.display = "inline";
    var previewDeepfakeImg = document.getElementById(previewId);
    var uploadFileDeepfake = document.getElementById(uploadFileId);

    // Set canvas width and height to match image or video size
    canvasField.width = previewDeepfakeImg.clientWidth;
    canvasField.height = previewDeepfakeImg.clientHeight;
    var canvasWidth = canvasField.width;
    var canvasHeight = canvasField.height;

    const ctx = canvasField.getContext("2d");
    let rects = [];

    canvasField.dataset.rectangles = JSON.stringify(rects);

    let handleMouseDown;
    let handleMouseMove;
    let handleMouseUp;

    // Render the current rectangles
    function render() {
      ctx.clearRect(0, 0, canvasField.width, canvasField.height);
      for (const rect of rects) {
        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }
    }

    function turnOnDrawMode() {
      // Turn on drawing mode
      let isDrawing = false;
      let startX, startY, currentX, currentY;

      // Store the offset values
      const rect = canvasField.getBoundingClientRect();
      const offsetX = rect.left + window.scrollX;
      const offsetY = rect.top + window.scrollY;

      handleMouseDown = function (event) {
        // Start drawing a new rectangle
        isDrawing = true;
        startX = event.clientX - offsetX;
        startY = event.clientY - offsetY;
        currentX = startX;
        currentY = startY;
      };

      handleMouseMove = function (event) {
        if (isDrawing) {
          // Update the current rectangle
          currentX = event.clientX - offsetX;
          currentY = event.clientY - offsetY;
          render();
          ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
          ctx.lineWidth = 2;
          ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
        } else {
          // record rects on value of button
          canvasField.dataset.rectangles = JSON.stringify(rects);
        }
      };

      handleMouseUp = function (event) {
        if (isDrawing) {
          // Add the new rectangle
          const x = Math.min(startX, currentX);
          const y = Math.min(startY, currentY);
          const width = Math.abs(currentX - startX);
          const height = Math.abs(currentY - startY);
          rects = [{ x, y, width, height, canvasWidth, canvasHeight }]; // keep only one rectangles
          // rects.push({x, y, width, height});  // for multi rectangles
          // Render the current rectangles
          render();
          isDrawing = false;
        }
      };

      canvasField.addEventListener("mousedown", handleMouseDown);
      canvasField.addEventListener("mousemove", handleMouseMove);
      canvasField.addEventListener("mouseup", handleMouseUp);
    }

    function turnOffDrawMode() {
      canvasField.removeEventListener("mousedown", handleMouseDown);
      canvasField.removeEventListener("mousemove", handleMouseMove);
      canvasField.removeEventListener("mouseup", handleMouseUp);
    }

    drawButton.onclick = async function () {
      if (drawButton.getAttribute("data-controlval") === "get-face") {
        drawButton.setAttribute("data-controlval", "put-content");
        drawButton.textContent = await translateWithGoogle(
          "Выбор файла",
          "auto",
          targetLang
        );
        turnOnDrawMode();
        uploadFileDeepfake.disabled = true;
        canvasField.style.zIndex = 20;
        clearButton.style.display = "inline";
      } else {
        drawButton.setAttribute("data-controlval", "get-face");
        drawButton.textContent = await translateWithGoogle(
          "Выделить лицо",
          "auto",
          targetLang
        );
        turnOffDrawMode();
        uploadFileDeepfake.disabled = false;
        canvasField.style.zIndex = 0;
        clearButton.style.display = "none";
      }
    };

    clearButton.onclick = function () {
      // Remove the last rectangle
      rects = [];
      // Render the current rectangles
      render();
      canvasField.dataset.rectangles = JSON.stringify(rects);
    };
    // DRAW RECTANGLES //
  };
  reader.readAsDataURL(file);
}

function dragDropAudioDeepfakeFaceAnimation(event) {
  if (event.target.files.length === 0) {
    console.warn("No files selected");
    return; // Exit the function if no files were selected
  }

  var file = URL.createObjectURL(event.target.files[0]);
  // Get audio length
  var audioElement = new Audio(file);
  audioElement.onloadedmetadata = function () {
    // Set audio length on the text element
    audioLength = document.getElementById("audio-length");
    audioLength.innerText = audioElement.duration.toFixed(1);
    // Get field element and control display
    var fieldsetControl = document.getElementById("fieldset-control-duration");
    var videoLength = document.getElementById("video-length").innerText;
    if (videoLength !== "0") {
      fieldsetControl.style.display = "block";
    } else {
      fieldsetControl.style.display = "none";
    }
  };
  var reader = new FileReader();
  var preview = document.getElementById("previewDeepfakeAudio");
  preview.innerHTML = `<button id="audioDeepfakePlay" class="introjs-button" style="display:inline;margin-left: 5pt;">
                          <i class="fa fa-play"></i>
                          <i style="display: none;" class="fa fa-pause"></i>
                      </button>
                      <audio id="audioDeepfakeSrc" style="display:none;" controls preload="none">
                        <source src="${file}">
                        Your browser does not support audio.
                      </audio>`;

  var playBtn = document.getElementById("audioDeepfakePlay");
  var audio = document.getElementById("audioDeepfakeSrc");

  playBtn.addEventListener("click", function () {
    if (audio.paused) {
      audio.play();
      playBtn.children[0].style.display = "none";
      playBtn.children[1].style.display = "inline";
    } else {
      audio.pause();
      playBtn.children[0].style.display = "inline";
      playBtn.children[1].style.display = "none";
    }
  });

  audio.addEventListener("ended", function () {
    playBtn.children[0].style.display = "inline";
    playBtn.children[1].style.display = "none";
  });
}

function drag(elem) {
  elem.parentNode.className = "draging dragBox dragBoxMain";
  // Add dragleave and dragend event listeners
  elem.addEventListener("dragleave", handleDragLeaveOrEnd);
  elem.addEventListener("dragend", handleDragLeaveOrEnd);
  // Check if the element has the specific border style applied
  var dragBoxes = document.querySelectorAll(".dragBoxMain");
  dragBoxes.forEach(function (box) {
    box.style.border = "none";
  });
}

function drop(elem) {
  elem.parentNode.className = "dragBox dragBoxMain";
}

// Function to handle when drag leaves target or drag ends without dropping
function handleDragLeaveOrEnd(event) {
  // Remove 'dragging' styles
  event.currentTarget.parentNode.className = "dragBox dragBoxMain";

  // Remove these listeners if they're no longer necessary
  event.currentTarget.removeEventListener("dragleave", handleDragLeaveOrEnd);
  event.currentTarget.removeEventListener("dragend", handleDragLeaveOrEnd);
}
// ANIMATE WINDOWS //

function loadImage(e) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function () {
      resolve({ width: this.width, height: this.height, element: img });
    };
    img.src = e.target.result;
  });
}

function loadVideo(e) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.onloadedmetadata = function () {
      resolve({
        width: this.videoWidth,
        height: this.videoHeight,
        element: video,
      });
    };
    video.src = e.target.result;
  });
}
